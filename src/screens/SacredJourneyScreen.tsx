import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Share,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useSimpleMode } from '../contexts/SimpleModeContext';
import { storage } from '../services/storage';
import {
  CALENDAR_REGIONS,
  CalendarRegion,
  detectRegionFromCoords,
  EventType,
  getQuoteForEvent,
  getUpcomingEvents,
  ResolvedEvent,
  Sect,
} from '../constants/islamicCalendar';
import { AdBanner } from '../components/AdBanner';
import { AD_UNITS } from '../services/ads';
import {
  requestNotificationPermissions,
  scheduleSacredCountdownNotifications,
  setupNotificationChannel,
} from '../services/notifications';

const TICK_INTERVAL_MS = 60 * 1000;

type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  isNow: boolean;
};

function computeCountdown(target: Date, now: Date = new Date()): CountdownParts {
  // Normalize both to midnight so "days" counts full calendar days remaining.
  const t = new Date(target); t.setHours(0, 0, 0, 0);
  const n = new Date(now);    n.setHours(0, 0, 0, 0);
  const diffMs = t.getTime() - n.getTime();
  if (diffMs <= 0) {
    // Event is today or past — show live hours/minutes using real timestamps.
    const liveDiff = target.getTime() - now.getTime();
    if (liveDiff <= 0) return { days: 0, hours: 0, minutes: 0, isNow: true };
    return {
      days: 0,
      hours: Math.floor(liveDiff / (1000 * 60 * 60)),
      minutes: Math.floor((liveDiff / (1000 * 60)) % 60),
      isNow: false,
    };
  }
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((target.getTime() - now.getTime()) / (1000 * 60 * 60)) % 24;
  const minutes = Math.floor((target.getTime() - now.getTime()) / (1000 * 60)) % 60;
  return { days, hours: Math.max(0, hours), minutes: Math.max(0, minutes), isNow: false };
}

function eventGradient(type: EventType): [string, string] {
  switch (type) {
    case 'ramadan_start':
    case 'laylat_al_qadr':
    case 'shab_e_barat':
      return ['#4A3B1A', '#1F2B1C'];
    case 'eid_fitr':
    case 'eid_adha':
      return ['#C8780A', '#8A4F05'];
    case 'arafah':
    case 'dhul_hijjah_start':
      return ['#8A4F05', '#1A5A2C'];
    case 'mawlid':
      return ['#A83E5B', '#4A1D29'];
    default:
      return ['#7A5A40', '#3C2510'];
  }
}

export function SacredJourneyScreen() {
  const { language } = useLanguage();
  const { fs } = useSimpleMode();

  const [sect, setSect] = useState<Sect | null>(null);
  const [region, setRegion] = useState<CalendarRegion | null>(null);
  const [mutedIds, setMutedIds] = useState<string[]>([]);
  const [masterEnabled, setMasterEnabled] = useState(true);
  const [now, setNow] = useState<Date>(new Date());
  const [regionPickerOpen, setRegionPickerOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const isUrdu = language === 'ur';
  const isArabic = language === 'ar';

  // Region auto-detected from last known location if not yet persisted.
  useEffect(() => {
    (async () => {
      const [fiqh, savedRegion, prefs, loc] = await Promise.all([
        storage.getFiqhSchool(),
        storage.getCalendarRegion(),
        storage.getSacredCountdownPrefs(),
        storage.getLocation(),
      ]);
      setSect(fiqh);
      setMutedIds(prefs.mutedEventIds);
      setMasterEnabled(prefs.enabled);

      let resolvedRegion = savedRegion;
      if (!resolvedRegion) {
        resolvedRegion = loc ? detectRegionFromCoords(loc.latitude, loc.longitude) : 'global';
        await storage.setCalendarRegion(resolvedRegion);
      }
      setRegion(resolvedRegion);
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), TICK_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const upcoming: ResolvedEvent[] = useMemo(() => {
    if (!region) return [];
    return getUpcomingEvents(sect, region, now);
  }, [sect, region, now]);

  const next = upcoming[0] ?? null;
  const upcomingRest = upcoming.slice(1, 10);

  const persistAndReschedule = useCallback(
    async (next: { mutedEventIds: string[]; enabled: boolean }) => {
      if (!region) return;
      await storage.setSacredCountdownPrefs({
        ...next,
        lastScheduledAt: new Date().toISOString().slice(0, 10),
      });
      if (!next.enabled) {
        await scheduleSacredCountdownNotifications(sect, region, ['__all__'], language);
        return;
      }
      const granted = await requestNotificationPermissions();
      if (granted) {
        await setupNotificationChannel();
        await scheduleSacredCountdownNotifications(sect, region, next.mutedEventIds, language);
      }
    },
    [sect, region, language]
  );

  const toggleMute = (eventId: string) => {
    const nextMuted = mutedIds.includes(eventId)
      ? mutedIds.filter((id) => id !== eventId)
      : [...mutedIds, eventId];
    setMutedIds(nextMuted);
    persistAndReschedule({ mutedEventIds: nextMuted, enabled: masterEnabled }).catch(() => {});
  };

  const toggleMaster = () => {
    const nextEnabled = !masterEnabled;
    setMasterEnabled(nextEnabled);
    persistAndReschedule({ mutedEventIds: mutedIds, enabled: nextEnabled }).catch(() => {});
  };

  const pickRegion = async (r: CalendarRegion) => {
    setRegion(r);
    setRegionPickerOpen(false);
    await storage.setCalendarRegion(r);
    // Changing region changes effective dates → must reschedule.
    if (masterEnabled) {
      const granted = await requestNotificationPermissions();
      if (granted) {
        await setupNotificationChannel();
        await scheduleSacredCountdownNotifications(sect, r, mutedIds, language);
      }
    }
  };

  const onShareNext = async () => {
    if (!next) return;
    const eventName =
      isUrdu ? next.nameUr : isArabic ? next.nameAr : next.nameEn;
    const countdown = computeCountdown(next.effectiveDate, now);
    const countdownStr = countdown.isNow
      ? isUrdu ? 'آج' : 'today'
      : isUrdu
      ? `${countdown.days} دن، ${countdown.hours} گھنٹے`
      : `${countdown.days} days, ${countdown.hours} hours`;
    const quote = getQuoteForEvent(next.type, countdown.days);
    const body = isUrdu ? quote.ur : quote.en;
    const text = `${next.icon} ${eventName} — ${countdownStr}\n\n"${body}"\n— ${quote.source}\n\nNoor · Your Muslim Companion`;
    try {
      await Share.share({ message: text });
    } catch {
      Alert.alert(isUrdu ? 'خرابی' : 'Error', isUrdu ? 'شیئر نہیں ہو سکا' : 'Could not share');
    }
  };

  if (!hydrated || !region) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.colors.textMuted }}>…</Text>
      </View>
    );
  }

  const regionLabel = (id: CalendarRegion): string => {
    const r = CALENDAR_REGIONS.find((x) => x.id === id)!;
    return isUrdu ? r.labelUr : isArabic ? r.labelAr : r.labelEn;
  };

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.regionPill}
            onPress={() => setRegionPickerOpen(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.regionIcon}>📍</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.regionLabel, { fontSize: fs(10) }]}>
                {isUrdu ? 'دن کی بنیاد' : isArabic ? 'المنطقة' : 'Dates based on'}
              </Text>
              <Text style={[styles.regionValue, { fontSize: fs(13) }]} numberOfLines={1} ellipsizeMode="tail">
                {regionLabel(region)}
              </Text>
            </View>
            <Text style={styles.regionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bellBtn, !masterEnabled && styles.bellBtnMuted]}
            onPress={toggleMaster}
            activeOpacity={0.8}
          >
            <Text style={[styles.bellIcon, !masterEnabled && styles.bellIconMuted]}>
              {masterEnabled ? '🔔' : '🔕'}
            </Text>
          </TouchableOpacity>
        </View>

        {next ? (
          <HeroCard
            event={next}
            now={now}
            language={language}
            fs={fs}
            onShare={onShareNext}
          />
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🌙</Text>
            <Text style={[styles.emptyText, { fontSize: fs(15) }]}>
              {isUrdu
                ? 'فی الحال کوئی واقعہ شیڈول نہیں۔'
                : isArabic
                ? 'لا توجد أحداث مجدولة حالياً.'
                : 'No upcoming events scheduled.'}
            </Text>
          </View>
        )}

        {upcomingRest.length > 0 && (
          <View style={styles.timelineSection}>
            <Text style={[styles.sectionTitle, { fontSize: fs(18) }]}>
              {isUrdu ? 'آنے والے دن' : isArabic ? 'الأحداث القادمة' : 'The Journey Ahead'}
            </Text>
            <Text style={[styles.sectionSub, { fontSize: fs(13) }]}>
              {isUrdu
                ? 'ہر واقعہ پر ٹیپ کر کے یاد دہانی بند یا چالو کریں'
                : isArabic
                ? 'اضغط لإيقاف أو تفعيل التذكيرات'
                : 'Tap an event to mute or enable reminders'}
            </Text>
            <View style={styles.timeline}>
              {upcomingRest.map((event, idx) => (
                <TimelineItem
                  key={event.id}
                  event={event}
                  now={now}
                  isLast={idx === upcomingRest.length - 1}
                  muted={mutedIds.includes(event.id)}
                  onToggleMute={() => toggleMute(event.id)}
                  language={language}
                  fs={fs}
                />
              ))}
            </View>
          </View>
        )}

        <View style={styles.footerNote}>
          <Text style={[styles.footerText, { fontSize: fs(12) }]}>
            {isUrdu
              ? 'نوٹ: اصل تاریخ آپ کے علاقے کی رویتِ ہلال کے مطابق ±۱-۲ دن تک مختلف ہو سکتی ہے۔'
              : isArabic
              ? 'ملاحظة: التاريخ الفعلي قد يختلف ±١-٢ يوم حسب رؤية الهلال محلياً.'
              : 'Note: actual dates may vary ±1–2 days depending on your local moonsighting.'}
          </Text>
        </View>
        <AdBanner unitId={AD_UNITS.bannerSacred} />
      </ScrollView>

      <Modal
        visible={regionPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setRegionPickerOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={[styles.modalTitle, { fontSize: fs(18) }]}>
              {isUrdu ? 'اپنا علاقہ منتخب کریں' : isArabic ? 'اختر منطقتك' : 'Choose your region'}
            </Text>
            <Text style={[styles.modalSub, { fontSize: fs(13) }]}>
              {isUrdu
                ? 'اسلامی دن آپ کے علاقے کی رویتِ ہلال کمیٹی کے مطابق ہوں گے۔'
                : isArabic
                ? 'ستعتمد التواريخ على هيئة رؤية الهلال في منطقتك.'
                : 'Dates will follow your regional moonsighting authority.'}
            </Text>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {CALENDAR_REGIONS.map((r) => {
                const selected = r.id === region;
                return (
                  <TouchableOpacity
                    key={r.id}
                    style={[styles.regionOption, selected && styles.regionOptionSelected]}
                    onPress={() => pickRegion(r.id)}
                    activeOpacity={0.8}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.regionOptionLabel, { fontSize: fs(15) }, selected && styles.regionOptionLabelSelected]}>
                        {isUrdu ? r.labelUr : isArabic ? r.labelAr : r.labelEn}
                      </Text>
                      <Text style={[styles.regionOptionSub, { fontSize: fs(11) }]} numberOfLines={1} ellipsizeMode="tail">
                        {r.sample}
                      </Text>
                    </View>
                    {selected && <Text style={styles.regionCheck}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setRegionPickerOpen(false)}
            >
              <Text style={styles.modalCloseBtnText}>
                {isUrdu ? 'بند کریں' : isArabic ? 'إغلاق' : 'Close'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function HeroCard({
  event,
  now,
  language,
  fs,
  onShare,
}: {
  event: ResolvedEvent;
  now: Date;
  language: 'en' | 'ur' | 'ar';
  fs: (n: number) => number;
  onShare: () => void;
}) {
  const countdown = useMemo(() => computeCountdown(event.effectiveDate, now), [event, now]);
  const quote = useMemo(
    () => getQuoteForEvent(event.type, countdown.days),
    [event.type, countdown.days]
  );
  const isUrdu = language === 'ur';
  const isArabic = language === 'ar';
  const eventName = isUrdu ? event.nameUr : isArabic ? event.nameAr : event.nameEn;
  const dateStr = event.effectiveDate.toLocaleDateString(
    isUrdu ? 'ur-PK' : isArabic ? 'ar-SA' : 'en-US',
    { weekday: 'long', month: 'long', day: 'numeric' }
  );
  const body = isUrdu ? quote.ur : quote.en;
  const [gradStart, gradEnd] = eventGradient(event.type);

  return (
    <View style={styles.heroWrap}>
      <LinearGradient
        colors={[gradStart, gradEnd]}
        style={styles.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.heroGlow}>
          <Text style={styles.heroIcon}>{event.icon}</Text>
        </View>

        <Text style={[styles.heroLabel, { fontSize: fs(11) }]}>
          {isUrdu ? 'اگلا مقدس دن' : isArabic ? 'الحدث القادم' : 'NEXT SACRED EVENT'}
        </Text>
        <Text style={[styles.heroTitle, { fontSize: fs(28) }]}>{eventName}</Text>
        <Text style={[styles.heroDate, { fontSize: fs(12) }]}>{dateStr}</Text>

        <View style={styles.countdownRow}>
          <CountdownBlock value={countdown.days} label={isUrdu ? 'دن' : isArabic ? 'يوم' : 'days'} fs={fs} />
          <View style={styles.countdownDivider} />
          <CountdownBlock value={countdown.hours} label={isUrdu ? 'گھنٹے' : isArabic ? 'ساعة' : 'hrs'} fs={fs} />
          <View style={styles.countdownDivider} />
          <CountdownBlock value={countdown.minutes} label={isUrdu ? 'منٹ' : isArabic ? 'دقيقة' : 'mins'} fs={fs} />
        </View>

        <View style={styles.quoteBox}>
          {quote.arabic ? (
            <Text style={styles.quoteArabic}>{quote.arabic}</Text>
          ) : null}
          <Text style={[styles.quoteBody, { fontSize: fs(14), textAlign: isUrdu ? 'right' : 'left' }]}>
            {body}
          </Text>
          <Text style={[styles.quoteSource, { fontSize: fs(11) }]}>— {quote.source}</Text>
        </View>

        <TouchableOpacity style={styles.shareBtn} onPress={onShare} activeOpacity={0.85}>
          <Text style={[styles.shareBtnText, { fontSize: fs(13) }]}>
            {isUrdu ? '📤 شیئر کریں' : isArabic ? '📤 مشاركة' : '📤 Share'}
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

function CountdownBlock({
  value,
  label,
  fs,
}: {
  value: number;
  label: string;
  fs: (n: number) => number;
}) {
  return (
    <View style={styles.countdownBlock}>
      <Text style={[styles.countdownValue, { fontSize: fs(34) }]}>
        {String(value).padStart(2, '0')}
      </Text>
      <Text style={[styles.countdownLabel, { fontSize: fs(10) }]}>{label}</Text>
    </View>
  );
}

function TimelineItem({
  event,
  now,
  isLast,
  muted,
  onToggleMute,
  language,
  fs,
}: {
  event: ResolvedEvent;
  now: Date;
  isLast: boolean;
  muted: boolean;
  onToggleMute: () => void;
  language: 'en' | 'ur' | 'ar';
  fs: (n: number) => number;
}) {
  const isUrdu = language === 'ur';
  const isArabic = language === 'ar';
  const eventName = isUrdu ? event.nameUr : isArabic ? event.nameAr : event.nameEn;
  const countdown = computeCountdown(event.effectiveDate, now);
  const dateStr = event.effectiveDate.toLocaleDateString(
    isUrdu ? 'ur-PK' : isArabic ? 'ar-SA' : 'en-US',
    { month: 'short', day: 'numeric', year: 'numeric' }
  );
  const daysTxt =
    countdown.days === 0
      ? isUrdu ? 'آج' : isArabic ? 'اليوم' : 'today'
      : countdown.days === 1
      ? isUrdu ? 'کل' : isArabic ? 'غداً' : 'tomorrow'
      : isUrdu
      ? `${countdown.days} دن`
      : isArabic
      ? `${countdown.days} يوم`
      : `in ${countdown.days} days`;

  return (
    <View style={styles.timelineItem}>
      <View style={styles.timelineLeft}>
        <View style={styles.timelineDot}>
          <Text style={styles.timelineDotIcon}>{event.icon}</Text>
        </View>
        {!isLast && <View style={styles.timelineLine} />}
      </View>
      <View style={styles.timelineBody}>
        <View style={styles.timelineHeader}>
          <Text style={[styles.timelineName, { fontSize: fs(15) }]} numberOfLines={1} ellipsizeMode="tail">
            {eventName}
          </Text>
          <TouchableOpacity
            onPress={onToggleMute}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.timelineMuteBtn}
          >
            <Text style={[styles.timelineMuteIcon, muted && styles.timelineMuteIconActive]}>
              {muted ? '🔕' : '🔔'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.timelineMetaRow}>
          <Text style={[styles.timelineDate, { fontSize: fs(12) }]}>{dateStr}</Text>
          <View style={styles.timelineDaysPill}>
            <Text style={[styles.timelineDaysText, { fontSize: fs(11) }]}>{daysTxt}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  container: { flex: 1 },
  content: {
    padding: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },

  topRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  regionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  regionIcon: { fontSize: 18 },
  regionLabel: {
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  regionValue: {
    fontFamily: theme.typography.fontBodyBold,
    color: theme.colors.text,
    marginTop: 1,
  },
  regionArrow: {
    color: theme.colors.textMuted,
    fontSize: 18,
  },
  bellBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  bellBtnMuted: {
    backgroundColor: theme.colors.backgroundSoft,
    borderColor: theme.colors.borderSoft,
  },
  bellIcon: { fontSize: 20 },
  bellIconMuted: { opacity: 0.45 },

  heroWrap: {
    marginBottom: theme.spacing.xxl,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#1C0F06',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.32,
        shadowRadius: 24,
      },
      android: { elevation: 10 },
    }),
  },
  hero: {
    padding: theme.spacing.xl,
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.xxl,
  },
  heroGlow: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  heroIcon: { fontSize: 34 },
  heroLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontFamily: theme.typography.fontBodyBold,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontFamily: theme.typography.fontHeadingBold,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  heroDate: {
    color: 'rgba(255,255,255,0.78)',
    fontFamily: theme.typography.fontBodyMedium,
    marginBottom: theme.spacing.xl,
  },

  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  countdownBlock: {
    flex: 1,
    alignItems: 'center',
  },
  countdownValue: {
    color: '#FFFFFF',
    fontFamily: theme.typography.fontHeadingBold,
    fontWeight: '700',
    letterSpacing: -1,
  },
  countdownLabel: {
    color: 'rgba(255,255,255,0.68)',
    fontFamily: theme.typography.fontBodyMedium,
    marginTop: 2,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  countdownDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },

  quoteBox: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(255,255,255,0.55)',
    marginBottom: theme.spacing.lg,
  },
  quoteArabic: {
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'right',
    marginBottom: theme.spacing.sm,
    lineHeight: 32,
    writingDirection: 'rtl',
    fontFamily: theme.typography.fontBodyMedium,
  },
  quoteBody: {
    color: 'rgba(255,255,255,0.92)',
    fontFamily: theme.typography.fontBody,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  quoteSource: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: theme.typography.fontBodyMedium,
    marginTop: 8,
    textAlign: 'right',
  },

  shareBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontFamily: theme.typography.fontBodyBold,
    letterSpacing: 0.5,
  },

  emptyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.xxl,
  },
  emptyEmoji: { fontSize: 48, marginBottom: theme.spacing.md },
  emptyText: { color: theme.colors.textMuted, fontFamily: theme.typography.fontBody },

  timelineSection: {
    marginTop: theme.spacing.md,
  },
  sectionTitle: {
    fontFamily: theme.typography.fontHeadingBold,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  sectionSub: {
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.lg,
  },
  timeline: { paddingLeft: theme.spacing.sm },

  timelineItem: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  timelineLeft: { alignItems: 'center', width: 40 },
  timelineDot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#7A5A40',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  timelineDotIcon: { fontSize: 16 },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: theme.colors.border,
    marginTop: 4,
    marginBottom: -theme.spacing.md,
  },
  timelineBody: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  timelineName: {
    flex: 1,
    fontFamily: theme.typography.fontBodyBold,
    color: theme.colors.text,
  },
  timelineMuteBtn: { paddingHorizontal: 4 },
  timelineMuteIcon: { fontSize: 16 },
  timelineMuteIconActive: { opacity: 0.5 },
  timelineMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timelineDate: {
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
  },
  timelineDaysPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: theme.colors.accentMuted,
    borderRadius: theme.borderRadius.full,
  },
  timelineDaysText: {
    fontFamily: theme.typography.fontBodyBold,
    color: theme.colors.accent,
    letterSpacing: 0.3,
  },

  footerNote: {
    marginTop: theme.spacing.xl,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.backgroundSoft,
    borderRadius: theme.borderRadius.md,
  },
  footerText: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBody,
    textAlign: 'center',
    lineHeight: 18,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(28,15,6,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  modalBox: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    width: '100%',
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16 },
      android: { elevation: 12 },
    }),
  },
  modalTitle: {
    fontFamily: theme.typography.fontHeadingBold,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  modalSub: {
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.lg,
  },
  modalScroll: {
    marginBottom: theme.spacing.lg,
  },
  regionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 8,
    gap: theme.spacing.sm,
  },
  regionOptionSelected: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentMuted,
  },
  regionOptionLabel: {
    fontFamily: theme.typography.fontBodyBold,
    color: theme.colors.text,
  },
  regionOptionLabelSelected: {
    color: theme.colors.accent,
  },
  regionOptionSub: {
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  regionCheck: {
    fontSize: 20,
    color: theme.colors.accent,
    fontWeight: '700',
  },
  modalCloseBtn: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    color: '#fff',
    fontFamily: theme.typography.fontBodyBold,
    fontSize: 15,
  },
});
