import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '../components/ui';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StreakRing } from '../components/StreakRing';
import { GoalItem } from '../components/GoalItem';
import { AdBanner } from '../components/AdBanner';
import { HadithOfDay } from '../components/HadithOfDay';
import { NextEventCard } from '../components/NextEventCard';
import { EidHubCard } from '../components/EidHubCard';
import { TodayCard } from '../components/TodayCard';
import { QuickActions } from '../components/QuickActions';
import { storage } from '../services/storage';
import { theme } from '../constants/theme';
import { computeStreak, nextStreakMilestone } from '../utils/streak';
import { getRandomQuote, type QuoteEntry } from '../constants/quotes';
import { AD_UNITS } from '../services/ads';
import { useLanguage } from '../contexts/LanguageContext';
import { useSimpleMode } from '../contexts/SimpleModeContext';
import { MenuButton } from '../components/MenuButton';
import { StreakCelebrationModal } from '../components/StreakCelebrationModal';
import { formatHijri, computeHijriOffsetFromServer } from '../utils/hijri';
import { getLocalDateKey } from '../utils/date';
import { isIndoPakRegion } from '../utils/region';

function getSubGreeting(t: ReturnType<typeof useLanguage>['t']): string {
  const hour = new Date().getHours();
  if (hour < 12) return t.morningGreeting;
  if (hour < 17) return t.afternoonGreeting;
  return t.eveningGreeting;
}

// Default goals shown on first launch. Saved to AsyncStorage on first read,
// so they must match the user's chosen language at install time — otherwise
// an Urdu / Arabic user sees English goals forever after.
const DEFAULT_GOALS_BY_LANG: Record<'en' | 'ur' | 'ar', { id: string; text: string; completed: boolean; date: string }[]> = {
  en: [
    { id: '1', text: 'Read 10 min of Quran',  completed: false, date: '' },
    { id: '2', text: 'Dhikr after Fajr',      completed: false, date: '' },
    { id: '3', text: 'Help someone today',    completed: false, date: '' },
  ],
  ur: [
    { id: '1', text: '۱۰ منٹ قرآن کی تلاوت',     completed: false, date: '' },
    { id: '2', text: 'فجر کے بعد ذکر',           completed: false, date: '' },
    { id: '3', text: 'آج کسی کی مدد کریں',       completed: false, date: '' },
  ],
  ar: [
    { id: '1', text: 'اقرأ ١٠ دقائق من القرآن',  completed: false, date: '' },
    { id: '2', text: 'الذكر بعد الفجر',          completed: false, date: '' },
    { id: '3', text: 'ساعد شخصاً اليوم',         completed: false, date: '' },
  ],
};

export function HomeScreen() {
  const { t, language } = useLanguage();
  const navigation = useNavigation();
  const { simpleMode, toggleSimpleMode, fs } = useSimpleMode();
  // Streak + Hijri are derived from storage. useFocusEffect re-reads them
  // every time the tab gets focus (HomeScreen never unmounts in the tab
  // navigator, so a plain useEffect would freeze the values).
  const [streak, setStreak] = useState(0);
  const [longest, setLongest] = useState(0);
  const [hijriOffset, setHijriOffset] = useState(0);
  const [day1CelebrationVisible, setDay1CelebrationVisible] = useState(false);
  const hijri = useMemo(() => formatHijri(new Date(), language, hijriOffset), [language, hijriOffset]);
  const defaultGoals = DEFAULT_GOALS_BY_LANG[language] ?? DEFAULT_GOALS_BY_LANG.en;
  const [goals, setGoals] = useState(defaultGoals);
  const [quote, setQuote] = useState<QuoteEntry>(getRandomQuote);

  const today = getLocalDateKey();

  // useFocusEffect (not useEffect) — the tab navigator keeps HomeScreen
  // mounted, so a plain useEffect would only fire on first mount and the
  // streak/goals would stay frozen when the user returns from Prayers.
  useFocusEffect(
    useCallback(() => {
      setQuote(getRandomQuote());
      let cancelled = false;
      (async () => {
        const [prayers, goalDays, rawOffset] = await Promise.all([
          storage.getPrayers(),
          storage.getGoalDays(),
          storage.getHijriOffsetRaw(),
        ]);
        if (cancelled) return;
        // First-launch Hijri seed: show a regional best-guess immediately, then
        // refine asynchronously against Aladhan's authoritative date. Subsequent
        // launches use the persisted value; users can still tune ±3 days from
        // Prayer Settings or tap "Auto-detect" there to re-fetch.
        let offset = rawOffset;
        if (rawOffset === null) {
          offset = isIndoPakRegion() ? -1 : 0;
          storage.setHijriOffset(offset).catch(() => {});
        }
        setHijriOffset(offset!);
        if (rawOffset === null) {
          computeHijriOffsetFromServer().then((fetched) => {
            if (cancelled || fetched == null) return;
            setHijriOffset(fetched);
            storage.setHijriOffset(fetched).catch(() => {});
          }).catch(() => {});
        }
        const { current, longest: longestRun } = computeStreak(prayers, goalDays);
        setStreak(current);
        setLongest(longestRun);

        if (current <= 0) {
          await storage.setLastStreakMilestone(0);
        } else {
          const last = await storage.getLastStreakMilestone();
          // When `last === null` the milestone tracker has never been written
          // — either a true fresh install or an upgrade from a build that
          // didn't track milestones. We want to celebrate Day 1 for a fresh
          // install but not retroactively congratulate an upgrade user who
          // already had a long streak. Heuristic: if their current streak is
          // exactly 1, treat as fresh install and let Day-1 fire; for any
          // larger current value, silently seed (their data clearly pre-dates
          // this build, so a sudden "10-day streak!" pop would be jarring).
          if (last === null && current > 1) {
            const passed = nextStreakMilestone(current, 0) ?? 0;
            await storage.setLastStreakMilestone(passed);
          } else {
            const baseline = last ?? 0;
            const reached = nextStreakMilestone(current, baseline);
            if (reached != null) {
              await storage.setLastStreakMilestone(reached);
              if (!cancelled) {
                if (reached === 1) {
                  setDay1CelebrationVisible(true);
                } else {
                  Alert.alert(
                    t.streakMilestoneTitle,
                    t.streakMilestoneBody.replace('{n}', String(reached))
                  );
                }
              }
            }
          }
        }

        const data = await storage.getGoals();
        if (cancelled) return;
        if (data.length > 0) setGoals(data);
        else {
          setGoals(defaultGoals);
          await storage.setGoals(defaultGoals);
        }
      })();
      return () => { cancelled = true; };
    }, [language, t.streakMilestoneTitle, t.streakMilestoneBody])
  );

  // A goal counts as completed only if it was checked TODAY. Carrying a
  // checkmark from a previous day was the bug the user hit on first open.
  const toggleGoal = async (id: string) => {
    const updated = goals.map((g) => {
      if (g.id !== id) return g;
      const isCompletedToday = g.completed && g.date === today;
      return isCompletedToday
        ? { ...g, completed: false, date: '' }
        : { ...g, completed: true, date: today };
    });
    setGoals(updated);
    await storage.setGoals(updated);
    // Log "user did something today" the first time any goal is checked off,
    // so the streak ring grows from goal completion too — not only from
    // marking prayers. addGoalDay is idempotent.
    const completedToday = updated.some((g) => g.completed && g.date === today);
    if (completedToday) {
      try {
        await storage.addGoalDay(today);
        const [prayers, goalDays] = await Promise.all([
          storage.getPrayers(),
          storage.getGoalDays(),
        ]);
        const { current, longest: longestRun } = computeStreak(prayers, goalDays);
        setStreak(current);
        setLongest(longestRun);
        // Fire the milestone alert here too — the useFocusEffect-only path
        // delayed the Day-1 celebration until the user navigated away and
        // back to Home. Now it pops the instant the threshold is crossed.
        const last = (await storage.getLastStreakMilestone()) ?? 0;
        const reached = nextStreakMilestone(current, last);
        if (reached != null) {
          await storage.setLastStreakMilestone(reached);
          if (reached === 1) {
            setDay1CelebrationVisible(true);
          } else {
            Alert.alert(
              t.streakMilestoneTitle,
              t.streakMilestoneBody.replace('{n}', String(reached))
            );
          }
        }
      } catch (err) {
        // Most common cause on Android is SQLITE_FULL — the device is out
        // of storage and AsyncStorage can't persist anything. Surface it
        // instead of silently swallowing, so the user knows why the streak
        // ring isn't moving despite their checkmarks.
        const msg = String(err);
        const isFull = msg.includes('SQLITE_FULL') || msg.includes('disk is full');
        Alert.alert(
          isFull ? "Noor's storage is full" : 'Could not save',
          isFull
            ? "Noor's internal cache filled up (this is the app's own storage, not your phone). Please fully close and re-open the app — it'll clean itself up on next launch."
            : 'Something went wrong saving your progress. Try again in a moment.'
        );
      }
    }
  };

  return (
    <Screen background={theme.colors.background}>
      <LinearGradient
        colors={['rgba(200, 120, 10, 0.09)', 'transparent']}
        style={styles.heroGradient}
        pointerEvents="none"
      />
      <View style={styles.topRow}>
        <View style={styles.greetingBlock}>
          <Text style={[styles.greeting, { fontSize: fs(26) }]} numberOfLines={1} adjustsFontSizeToFit>{t.greeting}</Text>
          <Text style={[styles.hijriBadge, { fontSize: fs(12) }]}>{hijri}</Text>
          <Text style={[styles.subGreeting, { fontSize: fs(15) }]}>{getSubGreeting(t)}</Text>
        </View>
        <MenuButton />
      </View>

      <View style={styles.streakSection}>
        <StreakRing current={streak} target={7} size={140} label={t.dayStreak} />
        <View style={styles.longestBadge}>
          <Text style={styles.longestText}>
            {t.bestStreak}: {longest} {t.days}
          </Text>
        </View>
      </View>

      <TodayCard hijriOffset={hijriOffset} />
      <EidHubCard />
      <NextEventCard />
      <QuickActions />

      <HadithOfDay />

      <View style={styles.quoteCard}>
        <Text style={styles.quoteMark}>"</Text>
        <Text style={[styles.quote, { fontSize: fs(16) }]}>{quote.text}</Text>
        <Text style={[styles.quoteSource, { fontSize: fs(13) }]}>— {quote.source}</Text>
      </View>

      <View style={styles.goalsSection}>
        <Text style={[styles.sectionTitle, { fontSize: fs(20) }]}>{t.todaysGoals}</Text>
        <Text style={[styles.sectionSubtitle, { fontSize: fs(14) }]}>{t.tapToComplete}</Text>
        {goals.map((g) => (
          <GoalItem
            key={g.id}
            text={g.text}
            completed={g.completed && g.date === today}
            onToggle={() => toggleGoal(g.id)}
          />
        ))}
      </View>

      <AdBanner unitId={AD_UNITS.bannerHome} />
      <StreakCelebrationModal
        visible={day1CelebrationVisible}
        title={t.day1CelebrationTitle}
        body={t.day1CelebrationBody}
        cta={t.day1CelebrationCta}
        onClose={() => setDay1CelebrationVisible(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xxl,
  },
  greetingBlock: {
    flex: 1,
    paddingRight: theme.spacing.md,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: theme.typography.fontHeadingBold,
    letterSpacing: -0.5,
  },
  subGreeting: {
    fontSize: 15,
    color: theme.colors.textMuted,
    marginTop: 6,
    fontFamily: theme.typography.fontBody,
    lineHeight: 22,
  },
  hijriBadge: {
    marginTop: 6,
    color: theme.colors.accent,
    fontFamily: theme.typography.fontBodyBold,
    letterSpacing: 0.3,
  },
  tasbihShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#7A5A40',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  tasbihIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tasbihIcon: { fontSize: 22 },
  tasbihTitle: {
    fontFamily: theme.typography.fontBodyBold,
    color: theme.colors.text,
  },
  tasbihSub: {
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  tasbihArrow: {
    fontSize: 24,
    color: theme.colors.textMuted,
  },
  streakSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  longestBadge: {
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  longestText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBodyMedium,
  },
  quoteCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    paddingLeft: theme.spacing.xxl,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.xxl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.accent,
    ...Platform.select({
      ios: {
        shadowColor: '#7A5A40',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  quoteMark: {
    position: 'absolute',
    top: theme.spacing.md,
    left: theme.spacing.lg,
    fontSize: 48,
    color: theme.colors.accent,
    opacity: 0.4,
    fontFamily: theme.typography.fontHeadingBold,
  },
  quote: {
    fontSize: 16,
    fontStyle: 'italic',
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontBody,
    lineHeight: 26,
  },
  quoteSource: {
    marginTop: 10,
    fontSize: 13,
    color: theme.colors.accent,
    fontFamily: theme.typography.fontBodyMedium,
    textAlign: 'right',
  },
  goalsSection: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: theme.typography.fontBodyBold,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.lg,
    fontFamily: theme.typography.fontBody,
  },
});
