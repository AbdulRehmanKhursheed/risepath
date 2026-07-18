import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen, Heading, Body, Caption, Card } from '../components/ui';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StreakRing } from '../components/StreakRing';
import { GoalItem } from '../components/GoalItem';
import { AdBanner } from '../components/AdBanner';
import { HadithOfDay } from '../components/HadithOfDay';
import { NextEventCard } from '../components/NextEventCard';
import { EidHubCard } from '../components/EidHubCard';
import { TodayCard, useDayKey } from '../components/TodayCard';
import { QuickActions } from '../components/QuickActions';
import { storage, type Goal } from '../services/storage';
import { theme } from '../constants/theme';
import { computeStreak, nextStreakMilestone } from '../utils/streak';
import { getRandomQuote, type QuoteEntry } from '../constants/quotes';
import { AD_UNITS } from '../services/ads';
import { useLanguage } from '../contexts/LanguageContext';
import { useSimpleMode } from '../contexts/SimpleModeContext';
import { MenuButton } from '../components/MenuButton';
import { StreakCelebrationModal } from '../components/StreakCelebrationModal';
import { formatHijri, computeHijriOffsetFromServer } from '../utils/hijri';
import { isIndoPakRegion } from '../utils/region';

function getSubGreeting(t: ReturnType<typeof useLanguage>['t']): string {
  const hour = new Date().getHours();
  if (hour < 12) return t.morningGreeting;
  if (hour < 17) return t.afternoonGreeting;
  return t.eveningGreeting;
}

// Default goals seeded on first launch. Earlier builds baked the install-time
// language's text into storage (ids '1'..'3'), so switching languages later
// left the goals in the first-run language forever. The seeded defaults now
// carry language-independent ids and their display text is resolved from the
// active language at render time; the stored text is only a fallback for
// goals we don't recognize (user-authored goals stay exactly as typed).
const DEFAULT_GOAL_TEXT: Record<string, Record<'en' | 'ur' | 'ar', string>> = {
  'default:quran': {
    en: 'Read 10 min of Quran',
    ur: '۱۰ منٹ قرآن کی تلاوت',
    ar: 'اقرأ ١٠ دقائق من القرآن',
  },
  'default:dhikr': {
    en: 'Dhikr after Fajr',
    ur: 'فجر کے بعد ذکر',
    ar: 'الذكر بعد الفجر',
  },
  'default:help': {
    en: 'Help someone today',
    ur: 'آج کسی کی مدد کریں',
    ar: 'ساعد شخصاً اليوم',
  },
};
const DEFAULT_GOAL_IDS = Object.keys(DEFAULT_GOAL_TEXT);
// Legacy seeded ids → stable ids, in seeding order.
const LEGACY_DEFAULT_IDS: Record<string, string> = {
  '1': 'default:quran',
  '2': 'default:dhikr',
  '3': 'default:help',
};

function seedDefaultGoals(language: 'en' | 'ur' | 'ar'): Goal[] {
  return DEFAULT_GOAL_IDS.map((id) => ({
    id,
    text: DEFAULT_GOAL_TEXT[id][language] ?? DEFAULT_GOAL_TEXT[id].en,
    completed: false,
    date: '',
  }));
}

// One-time migration for goals stored by earlier builds: a goal with a
// legacy id is remapped to its stable id only when its text exactly matches
// one of the known default texts (any language) — anything else is treated
// as user data and left untouched. Completion state and date are preserved.
function migrateDefaultGoals(stored: Goal[]): { goals: Goal[]; changed: boolean } {
  let changed = false;
  const goals = stored.map((g) => {
    const stableId = LEGACY_DEFAULT_IDS[g.id];
    if (!stableId) return g;
    const variants = Object.values(DEFAULT_GOAL_TEXT[stableId]);
    if (!variants.includes(g.text)) return g;
    changed = true;
    return { ...g, id: stableId };
  });
  return { goals, changed };
}

// Render-time text resolution: default goals follow the active language;
// unrecognized goals render their stored text as-is.
function resolveGoalText(goal: Goal, language: 'en' | 'ur' | 'ar'): string {
  const texts = DEFAULT_GOAL_TEXT[goal.id];
  if (!texts) return goal.text;
  return texts[language] ?? texts.en;
}

export function HomeScreen() {
  const { t, language } = useLanguage();
  const navigation = useNavigation();
  useSimpleMode(); // Subscribed to language/simpleMode for re-renders only; values flow through primitives.
  // Streak + Hijri are derived from storage. useFocusEffect re-reads them
  // every time the tab gets focus (HomeScreen never unmounts in the tab
  // navigator, so a plain useEffect would freeze the values).
  const [streak, setStreak] = useState(0);
  const [longest, setLongest] = useState(0);
  const [hijriOffset, setHijriOffset] = useState(0);
  const [day1CelebrationVisible, setDay1CelebrationVisible] = useState(false);
  // Shared day tick — HomeScreen never unmounts (keep-alive tab), so the
  // Hijri header and "completed today" goal checks would otherwise freeze
  // at yesterday's date when the process survives midnight.
  const dayKey = useDayKey();
  const hijri = useMemo(() => formatHijri(new Date(), language, hijriOffset), [language, hijriOffset, dayKey]);
  const [goals, setGoals] = useState<Goal[]>(() => seedDefaultGoals(language));
  const [quote, setQuote] = useState<QuoteEntry>(getRandomQuote);

  const today = dayKey;

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
        let seedPending = false;
        if (rawOffset === null) {
          offset = isIndoPakRegion() ? -1 : 0;
          storage.setHijriOffsetSeed(offset).catch(() => {});
          seedPending = true;
        } else {
          // A seed stored on an offline first launch stays flagged until a
          // server refinement lands — keep retrying on later launches instead
          // of freezing a possibly ±1-day guess forever.
          seedPending = await storage.isHijriSeedPending().catch(() => false);
        }
        setHijriOffset(offset!);
        if (seedPending) {
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
        if (data.length > 0) {
          // Remap legacy-id default goals to stable ids once, so their text
          // can follow the active language from here on.
          const { goals: migrated, changed } = migrateDefaultGoals(data);
          setGoals(migrated);
          if (changed) await storage.setGoals(migrated);
        } else {
          const seeded = seedDefaultGoals(language);
          setGoals(seeded);
          await storage.setGoals(seeded);
        }
      })();
      return () => { cancelled = true; };
      // Only `language` is meaningful here. The translation-string entries
      // are object-property reads from the LanguageContext and would
      // re-fire this entire async pipeline on every parent render, not just
      // on focus. They're referenced inside via t.* which stays current.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [language])
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
    <Screen
      background={theme.colors.background}
      footer={<AdBanner unitId={AD_UNITS.bannerHome} />}
    >
      <LinearGradient
        colors={['rgba(200, 120, 10, 0.14)', 'rgba(200, 120, 10, 0.04)', 'transparent']}
        style={styles.heroGradient}
        pointerEvents="none"
      />
      <View style={styles.topRow}>
        <View style={styles.greetingBlock}>
          <Heading level={1} numberOfLines={1} adjustsFontSizeToFit>{t.greeting}</Heading>
          <Caption
            tone="accent"
            weight="semibold"
            style={{ marginTop: theme.spacing.xs, letterSpacing: theme.typography.letterSpacing.wide }}
          >
            {hijri}
          </Caption>
          <Body tone="muted" style={{ marginTop: theme.spacing.xs }}>
            {getSubGreeting(t)}
          </Body>
        </View>
        <MenuButton />
      </View>

      <View style={styles.streakSection}>
        <StreakRing current={streak} target={7} size={140} label={t.dayStreak} />
        <Card
          variant="flat"
          padding={theme.spacing.sm}
          radius={theme.borderRadius.full}
          style={{ marginTop: theme.spacing.lg, paddingHorizontal: theme.spacing.lg }}
        >
          <Caption tone="muted" weight="medium">
            {t.bestStreak}: {longest} {t.days}
          </Caption>
        </Card>
      </View>

      <TodayCard hijriOffset={hijriOffset} />
      <EidHubCard />
      <NextEventCard />
      <QuickActions />

      <HadithOfDay />

      <Card
        style={{
          marginBottom: theme.spacing.xxl,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderLeftWidth: 4,
          borderLeftColor: theme.colors.accent,
          paddingLeft: theme.spacing.xxl,
        }}
      >
        <Text style={styles.quoteMark}>"</Text>
        <Body italic tone="secondary">
          {quote.text}
        </Body>
        <Caption
          tone="accent"
          weight="medium"
          style={{ marginTop: theme.spacing.md, textAlign: 'right' }}
        >
          — {quote.source}
        </Caption>
      </Card>

      <View style={styles.goalsSection}>
        <Heading level={2} style={{ marginBottom: theme.spacing.xs }}>
          {t.todaysGoals}
        </Heading>
        <Body tone="muted" style={{ marginBottom: theme.spacing.lg }}>
          {t.tapToComplete}
        </Body>
        {goals.map((g) => (
          <GoalItem
            key={g.id}
            text={resolveGoalText(g, language)}
            completed={g.completed && g.date === today}
            onToggle={() => toggleGoal(g.id)}
          />
        ))}
      </View>

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
    left: -theme.spacing.xl,   // extends past Screen's horizontal padding
    right: -theme.spacing.xl,  // extends past Screen's horizontal padding
    height: 360,
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
  streakSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
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
  goalsSection: {
    marginBottom: theme.spacing.lg,
  },
});
