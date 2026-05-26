import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Platform,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useLocation } from '../hooks/useLocation';
import { usePrayerTimes, PrayerName } from '../hooks/usePrayerTimes';
import { PrayerRow } from '../components/PrayerRow';
import { AdBanner } from '../components/AdBanner';
import { AD_UNITS } from '../services/ads';
import { PrayerSettingsModal } from '../components/PrayerSettingsModal';
import { storage, PrayerRecord } from '../services/storage';
import {
  requestNotificationPermissions,
  schedulePrayerNotificationsAhead,
  scheduleSacredCountdownNotifications,
  setupNotificationChannel,
} from '../services/notifications';
import { theme } from '../constants/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { MenuButton } from '../components/MenuButton';
import type { CalculationMethodId, MadhabId } from '../constants/prayerMethods';
import { detectRegionFromCoords } from '../constants/islamicCalendar';
import { getLocalDateKey } from '../utils/date';

function getDateString(d: Date): string {
  return getLocalDateKey(d);
}

function getWeekDates(): Date[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export function PrayerTrackerScreen() {
  const { t, language } = useLanguage();
  const { location, loading: locationLoading, usingFallback, permissionDenied, retry: retryLocation } = useLocation();
  const [prayers, setPrayers] = useState<Record<string, PrayerRecord>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [calculationMethod, setCalculationMethod] = useState<CalculationMethodId>('Karachi');
  const [madhab, setMadhab] = useState<MadhabId>('Shafi');

  const lat = location?.latitude ?? 24.8607;
  const lng = location?.longitude ?? 67.0011;
  // Stable date that only flips when the calendar day rolls over. The
  // previous useMemo(() => new Date(), [getDateString(new Date())]) looked
  // right but evaluated `new Date()` inside the memo body too, so the
  // identity changed on every parent re-render — triggering usePrayerTimes
  // recompute on every refresh-control toggle / location change.
  const [today, setToday] = useState(() => new Date());
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      if (getDateString(now) !== getDateString(today)) setToday(now);
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [today]);
  const prayerTimes = usePrayerTimes(lat, lng, today, calculationMethod, madhab);

  const prayerDisplayNames: Record<PrayerName, string> = {
    fajr: t.fajr,
    dhuhr: t.dhuhr,
    asr: t.asr,
    maghrib: t.maghrib,
    isha: t.isha,
  };

  useEffect(() => {
    storage.getPrayerSettings().then((s) => {
      if (s) {
        setCalculationMethod(s.calculationMethod as CalculationMethodId);
        setMadhab(s.madhab as MadhabId);
      }
    });
  }, []);

  const loadPrayers = useCallback(async () => {
    const data = await storage.getPrayers();
    setPrayers(data);
  }, []);

  // PrayerTracker is a tab screen, so it stays mounted on tab switches.
  // useFocusEffect re-reads storage when the user comes back from Sidebar /
  // Stats / Sacred Countdown, where prayers can be marked off elsewhere.
  useFocusEffect(
    useCallback(() => {
      loadPrayers().finally(() => setLoading(false));
    }, [loadPrayers])
  );

  const todayKey = getDateString(today);
  const todayRecord = prayers[todayKey] ?? {
    fajr: false,
    dhuhr: false,
    asr: false,
    maghrib: false,
    isha: false,
  };

  // Functional setState avoids the race where two rapid taps both close over
  // the same `prayers` snapshot — without this, the second tap would overwrite
  // the first because both compute their `updated` from the same baseline.
  // Use a ref to track the latest committed prayers map, so the storage write
  // doesn't depend on whether React 18 ran the updater synchronously or batched
  // it. Reading from prevRef inside the updater + writing to ref + storage
  // afterwards guarantees consistency regardless of batching.
  const prayersRef = useRef<Record<string, PrayerRecord>>({});
  useEffect(() => { prayersRef.current = prayers; }, [prayers]);

  const markPrayer = useCallback(
    async (key: PrayerName) => {
      const cur =
        prayersRef.current[todayKey] ?? {
          fajr: false,
          dhuhr: false,
          asr: false,
          maghrib: false,
          isha: false,
        };
      const next = { ...cur, [key]: !cur[key] };
      const updated = { ...prayersRef.current, [todayKey]: next };
      prayersRef.current = updated;
      setPrayers(updated);
      await storage.setPrayers(updated);
    },
    [todayKey]
  );

  // Guard: only reschedule notifications once per day-per-settings combo to
  // avoid repeated cancel/reschedule cycles on parent re-renders. The settings
  // tuple in the key ensures a calc-method/madhab change re-runs the schedule.
  const lastScheduledKey = useRef<string>('');
  const [notifDenied, setNotifDenied] = useState(false);
  useEffect(() => {
    const todayKey = getDateString(today);
    const scheduleKey = `${todayKey}|${calculationMethod}|${madhab}|${lat.toFixed(3)}|${lng.toFixed(3)}`;
    if (lastScheduledKey.current === scheduleKey) return;
    lastScheduledKey.current = scheduleKey;
    let cancelled = false;
    (async () => {
      const granted = await requestNotificationPermissions();
      if (cancelled) return;
      if (!granted) {
        // Surface the denial state so the screen can show a banner
        // instead of silently failing to schedule adhan reminders.
        setNotifDenied(true);
        return;
      }
      setNotifDenied(false);
      if (granted) {
        await setupNotificationChannel();
        // Schedule prayer reminders 7 days ahead so they survive app dormancy.
        await schedulePrayerNotificationsAhead(lat, lng, calculationMethod, madhab);
        if (cancelled) return;

        // Sacred Countdown: region-aware, sect-aware, per-event mute.
        const [fiqh, savedRegion, prefs, loc] = await Promise.all([
          storage.getFiqhSchool(),
          storage.getCalendarRegion(),
          storage.getSacredCountdownPrefs(),
          storage.getLocation(),
        ]);
        const region =
          savedRegion ??
          (loc ? detectRegionFromCoords(loc.latitude, loc.longitude) : 'global');
        if (!savedRegion) await storage.setCalendarRegion(region);
        if (prefs.enabled) {
          await scheduleSacredCountdownNotifications(
            fiqh,
            region,
            prefs.mutedEventIds,
            language
          );
        }
        if (cancelled) return;
        await storage.setSacredCountdownPrefs({
          ...prefs,
          lastScheduledAt: todayKey,
        });
      }
    })();
    return () => { cancelled = true; };
  }, [today, language, calculationMethod, madhab, lat, lng]);

  // Stable handlers for PrayerSettingsModal — inline arrows would be a new
  // reference on every parent render, forcing the modal to reconcile while
  // closed.
  const onSettingsClose = useCallback(() => setSettingsVisible(false), []);
  const onSettingsSave = useCallback(
    async (method: CalculationMethodId, m: MadhabId) => {
      const fiqhSchool: 'sunni' | 'shia' = method === 'Jafari' ? 'shia' : 'sunni';
      setCalculationMethod(method);
      setMadhab(m);
      await storage.setFiqhSchool(fiqhSchool);
      await storage.setPrayerSettings({ calculationMethod: method, madhab: m, fiqhSchool });
    },
    []
  );

  const getStatus = (key: PrayerName, prayerTime: Date): 'prayed' | 'missed' | 'upcoming' => {
    if (todayRecord[key]) return 'prayed';
    const now = new Date();
    if (prayerTime > now) return 'upcoming';
    return 'missed';
  };

  const weekDates = getWeekDates();
  const weekPrayerCounts = weekDates.map((d) => {
    const key = getDateString(d);
    const rec = prayers[key];
    if (!rec) return 0;
    return [rec.fajr, rec.dhuhr, rec.asr, rec.maghrib, rec.isha].filter(Boolean).length;
  });

  if (locationLoading || loading) {
    return (
      <View style={styles.center}>
        <LinearGradient
          colors={['rgba(200, 120, 10, 0.1)', 'transparent']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <ActivityIndicator size="large" color={theme.colors.accent} />
        <Text style={styles.loadingText}>{t.loadingPrayerTimes}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            try {
              await loadPrayers();
            } finally {
              setRefreshing(false);
            }
          }}
          tintColor={theme.colors.accent}
        />
      }
    >
      <LinearGradient
        colors={['rgba(200, 120, 10, 0.07)', 'transparent']}
        style={styles.heroGradient}
        pointerEvents="none"
      />
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{t.prayerTracker}</Text>
            <Text style={styles.subtitle}>
              {location
                ? `${t.timesForLocation} • ${calculationMethod}`
                : `${t.usingDefault} • ${calculationMethod}`}
            </Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={() => setSettingsVisible(true)}
            >
              <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
            <MenuButton />
          </View>
        </View>
      </View>

      <PrayerSettingsModal
        visible={settingsVisible}
        onClose={onSettingsClose}
        calculationMethod={calculationMethod}
        madhab={madhab}
        onSave={onSettingsSave}
      />

      {notifDenied && (
        <TouchableOpacity
          style={styles.locationBanner}
          onPress={() => Linking.openSettings().catch(() => {})}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={
            language === 'ur'
              ? 'اذان کی یاد دہانی کے لیے نوٹیفکیشن کی اجازت دیں'
              : 'Enable notifications for adhan reminders'
          }
        >
          <Text style={styles.locationBannerIcon}>🔔</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.locationBannerTitle}>
              {language === 'ur'
                ? 'اذان کی یاد دہانی بند ہے'
                : language === 'ar'
                ? 'تذكيرات الأذان معطّلة'
                : 'Adhan reminders are off'}
            </Text>
            <Text style={styles.locationBannerSub}>
              {language === 'ur'
                ? 'سیٹنگز میں نوٹیفکیشن کی اجازت دینے کے لیے ٹیپ کریں'
                : language === 'ar'
                ? 'اضغط للسماح بالإشعارات في الإعدادات'
                : 'Tap to enable notification permission in Settings'}
            </Text>
          </View>
          <Text style={styles.locationBannerArrow}>›</Text>
        </TouchableOpacity>
      )}

      {usingFallback && (
        <TouchableOpacity
          style={styles.locationBanner}
          onPress={() => {
            if (permissionDenied) {
              Linking.openSettings().catch(() => {});
            } else {
              retryLocation();
            }
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.locationBannerIcon}>📍</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.locationBannerTitle}>
              {language === 'ur'
                ? 'نماز کے اوقات کراچی کے حساب سے دکھائے جا رہے ہیں'
                : language === 'ar'
                ? 'تُعرض المواقيت بناءً على كراتشي'
                : 'Prayer times may be off — using Karachi as a default'}
            </Text>
            <Text style={styles.locationBannerSub}>
              {permissionDenied
                ? (language === 'ur'
                    ? 'لوکیشن کی اجازت دینے کے لیے ٹیپ کریں'
                    : language === 'ar'
                    ? 'اضغط للسماح بالموقع'
                    : 'Tap to allow location access in Settings')
                : (language === 'ur'
                    ? 'دوبارہ کوشش کے لیے ٹیپ کریں'
                    : language === 'ar'
                    ? 'اضغط لإعادة المحاولة'
                    : 'Tap to retry')}
            </Text>
          </View>
          <Text style={styles.locationBannerArrow}>›</Text>
        </TouchableOpacity>
      )}

      <View style={styles.weekCard}>
        <Text style={styles.weekLabel}>{t.thisWeek}</Text>
        <View style={styles.weekDots}>
          {t.weekDays.map((day, i) => (
            <View key={day} style={styles.dayCol}>
              <View
                style={[
                  styles.dot,
                  weekPrayerCounts[i] >= 5 && styles.dotFull,
                  weekPrayerCounts[i] > 0 && weekPrayerCounts[i] < 5 && styles.dotPartial,
                ]}
              />
              <Text style={styles.dayLabel}>{day}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.prayerList}>
        {prayerTimes.map((p) => (
          <PrayerRow
            key={p.key}
            name={prayerDisplayNames[p.key]}
            prayerKey={p.key}
            time={p.time}
            status={getStatus(p.key, p.time)}
            onPress={() => markPrayer(p.key)}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{t.tapToMarkReminders}</Text>
      </View>
      <AdBanner unitId={AD_UNITS.bannerPrayer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.xl,
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.xxxl,
  },
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: theme.spacing.lg,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBody,
    fontSize: 15,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    paddingRight: theme.spacing.md,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 22,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: theme.typography.fontHeadingBold,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textMuted,
    marginTop: 6,
    fontFamily: theme.typography.fontBody,
  },
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: '#FFF6E0',
    borderWidth: 1,
    borderColor: '#E0B53A',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  locationBannerIcon: {
    fontSize: 20,
  },
  locationBannerTitle: {
    fontSize: 13,
    fontFamily: theme.typography.fontBodyBold,
    color: '#7A5A0E',
  },
  locationBannerSub: {
    fontSize: 12,
    fontFamily: theme.typography.fontBody,
    color: '#A0780A',
    marginTop: 2,
  },
  locationBannerArrow: {
    fontSize: 18,
    color: '#A0780A',
  },
  weekCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#7A5A40',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  weekLabel: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.md,
    fontFamily: theme.typography.fontBodyMedium,
  },
  weekDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCol: {
    alignItems: 'center',
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.colors.border,
    marginBottom: 6,
  },
  dotPartial: {
    backgroundColor: theme.colors.accent,
    opacity: 0.6,
  },
  dotFull: {
    backgroundColor: theme.colors.accent,
  },
  dayLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBody,
  },
  prayerList: {
    marginBottom: theme.spacing.lg,
  },
  footer: {
    padding: theme.spacing.md,
  },
  footerText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
    fontFamily: theme.typography.fontBody,
  },
});
