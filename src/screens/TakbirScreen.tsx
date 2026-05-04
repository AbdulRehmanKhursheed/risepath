import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Vibration,
  Share,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useSimpleMode } from '../contexts/SimpleModeContext';
import { gregorianToHijri } from '../utils/hijri';
import { AdBanner } from '../components/AdBanner';
import { AD_UNITS } from '../services/ads';
import { PLAY_STORE_URL } from '../constants/appLinks';

type Locale = 'en' | 'ur' | 'ar';
type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

const STORAGE_KEY = 'takbir_tashreeq_v1';

const TAKBIR = {
  arabic:
    'اللّٰهُ أَكْبَرُ، اللّٰهُ أَكْبَرُ، لَا إِلٰهَ إِلَّا اللّٰهُ، وَاللّٰهُ أَكْبَرُ، اللّٰهُ أَكْبَرُ، وَلِلّٰهِ الْحَمْدُ',
  transliteration:
    'Allahu Akbar, Allahu Akbar, La ilaha illallah, Wallahu Akbar, Allahu Akbar, Wa Lillahil Hamd',
  translationEn:
    'Allah is the Greatest, Allah is the Greatest, there is no god but Allah, and Allah is the Greatest, Allah is the Greatest, and to Allah belongs all praise.',
  translationUr:
    'اللہ سب سے بڑا ہے، اللہ سب سے بڑا ہے، اللہ کے سوا کوئی معبود نہیں، اللہ سب سے بڑا ہے، اللہ سب سے بڑا ہے، اور تمام تعریفیں اللہ کے لیے ہیں۔',
  translationAr:
    'الله أكبر، الله أكبر، لا إله إلا الله، والله أكبر، الله أكبر، ولله الحمد',
  source: 'Musannaf Ibn Abi Shaybah',
};

// Days 9-13 Dhul Hijjah. The 13th has only Fajr/Dhuhr/Asr (Asr is the cutoff).
const DAYS: { day: number; prayers: PrayerKey[] }[] = [
  { day: 9,  prayers: ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] },
  { day: 10, prayers: ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] },
  { day: 11, prayers: ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] },
  { day: 12, prayers: ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] },
  { day: 13, prayers: ['fajr', 'dhuhr', 'asr'] },
];

const TOTAL_PRAYERS = DAYS.reduce((sum, d) => sum + d.prayers.length, 0); // 23

const PRAYER_LABELS: Record<PrayerKey, { en: string; ur: string; ar: string; short: string }> = {
  fajr:    { en: 'Fajr',    ur: 'فجر',     ar: 'الفجر',    short: 'F'  },
  dhuhr:   { en: 'Dhuhr',   ur: 'ظہر',     ar: 'الظهر',    short: 'Dh' },
  asr:     { en: 'Asr',     ur: 'عصر',     ar: 'العصر',    short: 'A'  },
  maghrib: { en: 'Maghrib', ur: 'مغرب',    ar: 'المغرب',   short: 'M'  },
  isha:    { en: 'Isha',    ur: 'عشاء',    ar: 'العشاء',   short: 'I'  },
};

function slotKey(year: number, day: number, prayer: PrayerKey): string {
  return `${year}-${day}-${prayer}`;
}

export function TakbirScreen() {
  const { language } = useLanguage();
  const { fs } = useSimpleMode();
  const locale: Locale = (['en', 'ur', 'ar'].includes(language as string)
    ? language
    : 'en') as Locale;
  const isUrdu = locale === 'ur';
  const isArabic = locale === 'ar';

  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);

  const hijri = useMemo(() => gregorianToHijri(new Date()), []);
  // Window: 9th-13th Dhul Hijjah. Hijri conversion is approximate (±1 day);
  // the tracker still works outside the window — just shows a soft state.
  const inWindow = hijri.month === 12 && hijri.day >= 9 && hijri.day <= 13;
  const todayDay = inWindow ? hijri.day : null;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        try {
          const parsed = JSON.parse(raw);
          // Only keep slots from the current Hijri year. Older years are pruned
          // automatically so users start fresh next year.
          const filtered: Record<string, boolean> = {};
          for (const k of Object.keys(parsed)) {
            if (k.startsWith(`${hijri.year}-`)) filtered[k] = parsed[k];
          }
          setCompleted(filtered);
        } catch {}
      })
      .finally(() => setHydrated(true));
  }, [hijri.year]);

  const persist = (next: Record<string, boolean>) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  };

  const toggleSlot = (day: number, prayer: PrayerKey) => {
    const k = slotKey(hijri.year, day, prayer);
    setCompleted((prev) => {
      const next = { ...prev };
      if (next[k]) delete next[k];
      else next[k] = true;
      persist(next);
      Vibration.vibrate(next[k] ? 35 : 15);
      return next;
    });
  };

  const doneCount = Object.keys(completed).filter((k) => k.startsWith(`${hijri.year}-`)).length;
  const progress = doneCount / TOTAL_PRAYERS;

  const onShare = async () => {
    const message =
      (isUrdu
        ? `${TAKBIR.arabic}\n\nتکبیراتِ تشریق — ۹ ذوالحجہ کی فجر سے ۱۳ ذوالحجہ کی عصر تک ہر فرض نماز کے بعد۔`
        : isArabic
        ? `${TAKBIR.arabic}\n\nتكبيرات التشريق — بعد كل صلاة فرض من فجر ٩ ذي الحجة إلى عصر ١٣ ذي الحجة.`
        : `${TAKBIR.arabic}\n${TAKBIR.transliteration}\n\nTakbir of Tashreeq — recited after every fard prayer from Fajr of 9th Dhul Hijjah to Asr of 13th Dhul Hijjah.`) +
      `\n\n— Noor · ${PLAY_STORE_URL}`;
    try {
      await Share.share({ message });
    } catch {
      Alert.alert(
        isUrdu ? 'خرابی' : isArabic ? 'خطأ' : 'Error',
        isUrdu ? 'شیئر نہیں ہو سکا' : isArabic ? 'تعذرت المشاركة' : 'Could not share'
      );
    }
  };

  const labels = {
    en: {
      title: 'Takbir of Tashreeq',
      subtitle: 'Recited after every fard prayer, 9th–13th Dhul Hijjah',
      windowOpen: `Active now — Day ${todayDay ?? ''} Dhul Hijjah`,
      windowSoon: 'Tap to mark prayers when the window opens (9th Dhul Hijjah).',
      windowAfter: 'Tashreeq days have passed — see you next year, in sha\' Allah.',
      progress: `${doneCount} of ${TOTAL_PRAYERS} prayers`,
      schedule: 'PRAYER TRACKER',
      share: 'Share Takbir',
      virtue: 'Hanafi: wajib on every adult Muslim. Other schools: emphasised sunnah. Men recite once audibly; women recite quietly.',
      day: 'Day',
      today: 'TODAY',
    },
    ur: {
      title: 'تکبیراتِ تشریق',
      subtitle: 'ہر فرض نماز کے بعد، ۹ سے ۱۳ ذوالحجہ',
      windowOpen: `جاری ہیں — ${todayDay ?? ''} ذوالحجہ`,
      windowSoon: '۹ ذوالحجہ سے تکبیرات کا آغاز ہوگا۔ ہر نماز کے بعد یہاں مارک کریں۔',
      windowAfter: 'ایامِ تشریق گزر چکے ہیں۔ اگلے سال ان شاء اللہ۔',
      progress: `${doneCount} / ${TOTAL_PRAYERS} نمازیں`,
      schedule: 'نماز ٹریکر',
      share: 'تکبیر شیئر کریں',
      virtue:
        'حنفی: ہر بالغ پر واجب۔ دیگر مسالک: سنتِ مؤکدہ۔ مرد بلند آواز سے، خواتین آہستہ پڑھیں۔',
      day: 'دن',
      today: 'آج',
    },
    ar: {
      title: 'تكبيرات التشريق',
      subtitle: 'بعد كل صلاة فرض من ٩ إلى ١٣ ذي الحجة',
      windowOpen: `الآن — ${todayDay ?? ''} ذو الحجة`,
      windowSoon: 'تبدأ التكبيرات من فجر ٩ ذي الحجة. سجّل بعد كل صلاة هنا.',
      windowAfter: 'انتهت أيام التشريق. إلى العام القادم إن شاء الله.',
      progress: `${doneCount} من ${TOTAL_PRAYERS} صلاة`,
      schedule: 'متابعة الصلوات',
      share: 'شارك التكبير',
      virtue:
        'الحنفية: واجب على كل بالغ. باقي المذاهب: سنة مؤكدة. الرجل يجهر مرة، المرأة تُسرّ.',
      day: 'اليوم',
      today: 'اليوم',
    },
  }[locale];

  const afterTashreeq = hijri.month === 12 && hijri.day > 13;
  const bannerText = inWindow
    ? labels.windowOpen
    : afterTashreeq
    ? labels.windowAfter
    : labels.windowSoon;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['rgba(200,120,10,0.18)', 'rgba(26,122,60,0.10)', 'transparent']}
          style={styles.hero}
        >
          <Text style={styles.heroEmoji}>📣</Text>
          <Text style={[styles.heroTitle, { fontSize: fs(24) }]}>{labels.title}</Text>
          <Text style={[styles.heroSub, { fontSize: fs(13) }]}>{labels.subtitle}</Text>
        </LinearGradient>

        <View style={[styles.banner, inWindow ? styles.bannerActive : styles.bannerSoft]}>
          <Text style={styles.bannerIcon}>{inWindow ? '✦' : '⏳'}</Text>
          <Text
            style={[
              styles.bannerText,
              inWindow && styles.bannerTextActive,
              { fontSize: fs(13) },
            ]}
          >
            {bannerText}
          </Text>
        </View>

        {/* Takbir card */}
        <View style={styles.takbirCard}>
          <Text style={styles.takbirArabic}>{TAKBIR.arabic}</Text>
          <Text style={[styles.takbirTranslit, { fontSize: fs(13) }]}>
            {TAKBIR.transliteration}
          </Text>
          <Text style={[styles.takbirTrans, { fontSize: fs(13) }]}>
            {isUrdu ? TAKBIR.translationUr : isArabic ? TAKBIR.translationAr : TAKBIR.translationEn}
          </Text>
          <Text style={[styles.takbirSource, { fontSize: fs(11) }]}>{TAKBIR.source}</Text>
        </View>

        {/* Progress */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, { fontSize: fs(11) }]}>
              {locale === 'ur' ? 'پیشرفت' : locale === 'ar' ? 'التقدم' : 'PROGRESS'}
            </Text>
            <Text style={[styles.progressValue, { fontSize: fs(14) }]}>{labels.progress}</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
        </View>

        {/* Day-by-day grid */}
        <Text style={[styles.sectionLabel, { fontSize: fs(11) }]}>{labels.schedule}</Text>
        <View style={styles.scheduleCard}>
          {DAYS.map((d) => {
            const isToday = inWindow && todayDay === d.day;
            return (
              <View key={d.day} style={[styles.dayRow, isToday && styles.dayRowToday]}>
                <View style={styles.dayLabel}>
                  <Text style={[styles.dayNumber, { fontSize: fs(20) }, isToday && styles.dayNumberToday]}>
                    {d.day}
                  </Text>
                  <Text style={[styles.dayMonth, { fontSize: fs(10) }]}>
                    {isUrdu ? 'ذوالحجہ' : isArabic ? 'ذو الحجة' : 'Dhul Hijjah'}
                  </Text>
                  {isToday && (
                    <Text style={[styles.todayPill, { fontSize: fs(9) }]}>{labels.today}</Text>
                  )}
                </View>
                <View style={styles.prayerRow}>
                  {d.prayers.map((p) => {
                    const k = slotKey(hijri.year, d.day, p);
                    const done = !!completed[k];
                    const pl = PRAYER_LABELS[p];
                    const pLabel = isUrdu ? pl.ur : isArabic ? pl.ar : pl.en;
                    return (
                      <TouchableOpacity
                        key={p}
                        style={[styles.prayerChip, done && styles.prayerChipDone]}
                        onPress={() => toggleSlot(d.day, p)}
                        activeOpacity={0.75}
                        disabled={!hydrated}
                      >
                        <Text
                          style={[
                            styles.prayerChipText,
                            done && styles.prayerChipTextDone,
                            { fontSize: fs(11) },
                          ]}
                          numberOfLines={1}
                        >
                          {done ? '✓ ' : ''}
                          {pLabel}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>

        <Text style={[styles.virtue, { fontSize: fs(12) }]}>{labels.virtue}</Text>

        <TouchableOpacity style={styles.shareBtn} onPress={onShare} activeOpacity={0.85}>
          <Text style={[styles.shareBtnText, { fontSize: fs(14) }]}>📤 {labels.share}</Text>
        </TouchableOpacity>

        <AdBanner unitId={AD_UNITS.bannerGuides} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingBottom: 40 },
  hero: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: theme.spacing.xl,
  },
  heroEmoji: { fontSize: 44, marginBottom: 6 },
  heroTitle: {
    fontFamily: theme.typography.fontHeadingBold,
    color: theme.colors.text,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  heroSub: {
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginHorizontal: theme.spacing.xl,
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    marginBottom: theme.spacing.lg,
  },
  bannerActive: {
    backgroundColor: 'rgba(26,122,60,0.10)',
    borderColor: theme.colors.success,
  },
  bannerSoft: {
    backgroundColor: theme.colors.accentMuted,
    borderColor: theme.colors.accent,
  },
  bannerIcon: { fontSize: 16, color: theme.colors.accent },
  bannerText: {
    flex: 1,
    fontFamily: theme.typography.fontBodyMedium,
    color: theme.colors.textSecondary,
  },
  bannerTextActive: {
    color: theme.colors.success,
    fontFamily: theme.typography.fontBodyBold,
  },

  takbirCard: {
    marginHorizontal: theme.spacing.xl,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 8,
  },
  takbirArabic: {
    fontFamily: 'System',
    fontSize: 24,
    lineHeight: 44,
    color: theme.colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  takbirTranslit: {
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },
  takbirTrans: {
    fontFamily: theme.typography.fontBodyMedium,
    color: theme.colors.textSecondary,
  },
  takbirSource: {
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
  },

  progressCard: {
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.lg,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 10,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontFamily: theme.typography.fontBodyBold,
    color: theme.colors.textMuted,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  progressValue: {
    fontFamily: theme.typography.fontBodyBold,
    color: theme.colors.accent,
  },
  progressTrack: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.accent,
  },

  sectionLabel: {
    fontFamily: theme.typography.fontBodyBold,
    color: theme.colors.textMuted,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  scheduleCard: {
    marginHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSoft,
    gap: theme.spacing.md,
  },
  dayRowToday: {
    backgroundColor: theme.colors.accentMuted,
  },
  dayLabel: {
    width: 64,
    alignItems: 'center',
  },
  dayNumber: {
    fontFamily: theme.typography.fontHeadingBold,
    color: theme.colors.text,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  dayNumberToday: { color: theme.colors.accent },
  dayMonth: {
    marginTop: 2,
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  todayPill: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    backgroundColor: theme.colors.accent,
    color: '#fff',
    fontFamily: theme.typography.fontBodyBold,
    letterSpacing: 0.6,
    overflow: 'hidden',
  },
  prayerRow: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  prayerChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minWidth: 56,
    alignItems: 'center',
  },
  prayerChipDone: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  prayerChipText: {
    fontFamily: theme.typography.fontBodyMedium,
    color: theme.colors.textSecondary,
  },
  prayerChipTextDone: {
    color: '#fff',
    fontFamily: theme.typography.fontBodyBold,
  },

  virtue: {
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.lg,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.success,
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textSecondary,
    lineHeight: 19,
  },

  shareBtn: {
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.lg,
    paddingVertical: 14,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: { elevation: 4 },
    }),
  },
  shareBtnText: {
    color: '#fff',
    fontFamily: theme.typography.fontBodyBold,
  },
});
