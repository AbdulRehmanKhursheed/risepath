import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { AdBanner } from '../components/AdBanner';
import { storage } from '../services/storage';
import { theme } from '../constants/theme';
import { AD_UNITS } from '../services/ads';
import { useLanguage } from '../contexts/LanguageContext';
import { computeStreak } from '../utils/streak';
import { getLocalDateKey, addLocalDays } from '../utils/date';
import { captureError } from '../services/sentry';

// Inline labels (same pattern as HifzScreen/TasbihScreen) — translations.ts
// is owned elsewhere, and these two strings are Stats-only.
const ERROR_LABELS: Record<'en' | 'ur' | 'ar', { loadError: string; retry: string }> = {
  en: { loadError: "Couldn't load your stats. Your saved data is untouched.", retry: 'Retry' },
  ur: { loadError: 'اعداد و شمار لوڈ نہیں ہو سکے۔ آپ کا محفوظ ڈیٹا متاثر نہیں ہوا۔', retry: 'دوبارہ کوشش کریں' },
  ar: { loadError: 'تعذر تحميل الإحصائيات. بياناتك المحفوظة سليمة.', retry: 'إعادة المحاولة' },
};

export function StatsScreen() {
  const { t, language } = useLanguage();
  const isRtl = language === 'ur' || language === 'ar';
  const errorLabels = ERROR_LABELS[language] ?? ERROR_LABELS.en;
  const [streak, setStreak] = useState(0);
  const [longest, setLongest] = useState(0);
  const [prayerConsistency, setPrayerConsistency] = useState(0);
  const [goalsThisWeek, setGoalsThisWeek] = useState(0);
  const [moodAvg, setMoodAvg] = useState(0);
  const [loadFailed, setLoadFailed] = useState(false);
  // Bumped by the error banner's Retry button to re-run the load without
  // waiting for the next focus.
  const [retryNonce, setRetryNonce] = useState(0);

  // useFocusEffect — Stats is reachable from the sidebar; without this the
  // numbers shown reflect first-mount data and never update after the user
  // prays, marks a goal, or logs a mood elsewhere.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        // All four reads up front so a mid-sequence failure can't leave a
        // partially-updated screen (e.g. fresh streak next to stale moods).
        const [prayers, goalDays, goals, moods] = await Promise.all([
          storage.getPrayers(),
          storage.getGoalDays(),
          storage.getGoals(),
          storage.getMoods(),
        ]);
        if (cancelled) return;
        // Pass goalDays so Stats matches Home's streak ring — goal-only days
        // count toward the streak too, not just prayer-active days.
        const { current, longest: longestRun } = computeStreak(prayers, goalDays);
        setStreak(current);
        setLongest(longestRun);

        const now = new Date();
        let prayed = 0;
        let total = 0;
        for (let i = 0; i < 7; i++) {
          const key = getLocalDateKey(addLocalDays(now, -i));
          const rec = prayers[key];
          if (rec) {
            prayed += [
              rec.fajr,
              rec.dhuhr,
              rec.asr,
              rec.maghrib,
              rec.isha,
            ].filter(Boolean).length;
            total += 5;
          }
        }
        setPrayerConsistency(total > 0 ? Math.round((prayed / total) * 100) : 0);

        // g.date is a LOCAL YYYY-MM-DD key (getLocalDateKey). The old
        // `new Date(g.date) >= weekAgo` parsed it as UTC midnight and
        // compared against a local timestamp, so the boundary day was
        // counted or dropped depending on timezone and time of day (the
        // same pitfall daysApart() in utils/streak.ts documents). Compare
        // date keys lexically instead — same 7-day window (today + 6 prior)
        // as the prayer-consistency card above.
        const weekAgoKey = getLocalDateKey(addLocalDays(now, -6));
        const completed = goals.filter(
          (g) => g.completed && g.date && g.date >= weekAgoKey
        );
        setGoalsThisWeek(completed.length);

        // Average over the last 7 calendar DAYS, not the last 7 entries —
        // MoodScreen appends an entry per tap, so seven taps in one sitting
        // used to turn the "weekly" average into a one-minute average.
        // Entries are newest-first, so the first entry seen for a date is
        // that day's latest mood.
        const latestPerDay = new Map<string, number>();
        for (const m of moods) {
          if (!m.mood || !m.date || m.date < weekAgoKey) continue;
          if (!latestPerDay.has(m.date)) latestPerDay.set(m.date, m.mood);
        }
        const dayMoods = [...latestPerDay.values()];
        const avg =
          dayMoods.length > 0
            ? dayMoods.reduce((s, m) => s + m, 0) / dayMoods.length
            : 0;
        setMoodAvg(Math.round(avg * 10) / 10);
        setLoadFailed(false);
      })().catch((err) => {
        // Without this catch a storage failure rejected unhandled and the
        // screen confidently showed zeros (or stale values) with no hint
        // anything went wrong. Keep the previous values and show a banner.
        captureError(err, { scope: 'stats:load' });
        if (!cancelled) setLoadFailed(true);
      });
      return () => { cancelled = true; };
    }, [retryNonce])
  );

  return (
    <View style={styles.root}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={['rgba(200, 120, 10, 0.07)', 'transparent']}
        style={styles.heroGradient}
        pointerEvents="none"
      />
      <Text style={styles.title}>{t.stats}</Text>
      <Text style={styles.subtitle}>{t.statsSubtitle}</Text>

      {loadFailed && (
        <View style={[styles.errorBanner, isRtl && { flexDirection: 'row-reverse' }]}>
          <Text
            style={[
              styles.errorText,
              isRtl && { textAlign: 'right', writingDirection: 'rtl' },
            ]}
          >
            {errorLabels.loadError}
          </Text>
          <TouchableOpacity
            onPress={() => setRetryNonce((n) => n + 1)}
            accessibilityRole="button"
            accessibilityLabel={errorLabels.retry}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.errorRetry}>{errorLabels.retry}</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.grid}>
        <View style={[styles.card, styles.cardHighlight]}>
          <Text style={styles.cardLabel}>{t.currentStreak}</Text>
          <Text style={styles.cardValue}>{streak}</Text>
          <Text style={styles.cardUnit}>{t.days}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{t.longestStreak}</Text>
          <Text style={styles.cardValue}>{longest}</Text>
          <Text style={styles.cardUnit}>{t.days}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>{t.prayerConsistency7}</Text>
        <Text style={[styles.cardValue, styles.cardValueLarge]}>{prayerConsistency}%</Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{t.goalsThisWeek}</Text>
          <Text style={styles.cardValue}>{goalsThisWeek}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{t.moodAverage}</Text>
          <Text style={styles.cardValue}>{moodAvg || '—'}</Text>
        </View>
      </View>

      <View style={styles.soulCard}>
        <Text style={styles.soulTitle}>{t.soulReport}</Text>
        <Text style={styles.soulText}>{t.soulReportText}</Text>
      </View>
    </ScrollView>
    <AdBanner unitId={AD_UNITS.bannerStats} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
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
    marginBottom: theme.spacing.xl,
    fontFamily: theme.typography.fontBody,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(200, 60, 30, 0.4)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBody,
    lineHeight: 18,
  },
  errorRetry: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.accent,
    fontFamily: theme.typography.fontBodyBold,
  },
  grid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  card: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#7A5A40',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.14,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  cardHighlight: {
    borderColor: 'rgba(200, 120, 10, 0.4)',
  },
  cardLabel: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginBottom: 8,
    fontFamily: theme.typography.fontBody,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.accent,
    fontFamily: theme.typography.fontHeadingBold,
  },
  cardValueLarge: {
    fontSize: 36,
  },
  cardUnit: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 2,
    fontFamily: theme.typography.fontBody,
  },
  soulCard: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.accent,
    ...Platform.select({
      ios: {
        shadowColor: '#7A5A40',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.14,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  soulTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
    fontFamily: theme.typography.fontBodyBold,
  },
  soulText: {
    fontSize: 15,
    color: theme.colors.textMuted,
    lineHeight: 22,
    fontFamily: theme.typography.fontBody,
  },
});
