import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StreakRing } from '../components/StreakRing';
import { GoalItem } from '../components/GoalItem';
import { storage } from '../services/storage';
import { theme } from '../constants/theme';
import { getRandomQuote, type QuoteEntry } from '../constants/quotes';
import { useLanguage } from '../contexts/LanguageContext';
import { LANGUAGES } from '../constants/translations';

function getSubGreeting(t: ReturnType<typeof useLanguage>['t']): string {
  const hour = new Date().getHours();
  if (hour < 12) return t.morningGreeting;
  if (hour < 17) return t.afternoonGreeting;
  return t.eveningGreeting;
}

const DEFAULT_GOALS = [
  { id: '1', text: 'Read 10 min of Quran', completed: false, date: '' },
  { id: '2', text: 'Dhikr after Fajr', completed: false, date: '' },
  { id: '3', text: 'Help someone today', completed: false, date: '' },
];

export function HomeScreen() {
  const { t, language, setLanguage, languages } = useLanguage();
  const [streak, setStreak] = useState(0);
  const [longest, setLongest] = useState(0);
  const [goals, setGoals] = useState(DEFAULT_GOALS);
  const [quote, setQuote] = useState<QuoteEntry>(getRandomQuote);

  useEffect(() => {
    setQuote(getRandomQuote());
    storage.getStreak().then((data) => {
      if (data) {
        setStreak(data.current);
        setLongest(data.longest);
      }
    });
    storage.getGoals().then((data) => {
      if (data.length > 0) setGoals(data);
      else storage.setGoals(DEFAULT_GOALS);
    });
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const toggleGoal = async (id: string) => {
    const updated = goals.map((g) =>
      g.id === id ? { ...g, completed: !g.completed, date: today } : g
    );
    setGoals(updated);
    await storage.setGoals(updated);
  };

  const cycleLanguage = () => {
    const idx = languages.findIndex((l) => l.id === language);
    const next = languages[(idx + 1) % languages.length];
    setLanguage(next.id);
  };

  const currentLangLabel = LANGUAGES.find((l) => l.id === language)?.nativeLabel ?? 'English';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={['rgba(200, 120, 10, 0.09)', 'transparent']}
        style={styles.heroGradient}
        pointerEvents="none"
      />

      <View style={styles.topRow}>
        <View style={styles.greetingBlock}>
          <Text style={styles.greeting}>{t.greeting}</Text>
          <Text style={styles.subGreeting}>{getSubGreeting(t)}</Text>
        </View>
        <TouchableOpacity style={styles.langPill} onPress={cycleLanguage} activeOpacity={0.8}>
          <Text style={styles.langIcon}>🌐</Text>
          <Text style={styles.langText}>{currentLangLabel}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.streakSection}>
        <StreakRing current={streak} target={7} size={140} />
        <View style={styles.longestBadge}>
          <Text style={styles.longestText}>
            {t.bestStreak}: {longest} {t.days}
          </Text>
        </View>
      </View>

      <View style={styles.quoteCard}>
        <Text style={styles.quoteMark}>"</Text>
        <Text style={styles.quote}>{quote.text}</Text>
        <Text style={styles.quoteSource}>— {quote.source}</Text>
      </View>

      <View style={styles.goalsSection}>
        <Text style={styles.sectionTitle}>{t.todaysGoals}</Text>
        <Text style={styles.sectionSubtitle}>{t.tapToComplete}</Text>
        {goals.map((g) => (
          <GoalItem
            key={g.id}
            text={g.text}
            completed={g.completed}
            onToggle={() => toggleGoal(g.id)}
          />
        ))}
      </View>
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
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#7A5A40',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  langIcon: {
    fontSize: 14,
  },
  langText: {
    fontSize: 13,
    color: theme.colors.accent,
    fontFamily: theme.typography.fontBodyMedium,
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
