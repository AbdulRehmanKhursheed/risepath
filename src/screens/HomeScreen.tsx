import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StreakRing } from '../components/StreakRing';
import { GoalItem } from '../components/GoalItem';
import { AdBanner } from '../components/AdBanner';
import { HadithOfDay } from '../components/HadithOfDay';
import { NextEventCard } from '../components/NextEventCard';
import { storage } from '../services/storage';
import { theme } from '../constants/theme';
import { getRandomQuote, type QuoteEntry } from '../constants/quotes';
import { AD_UNITS } from '../services/ads';
import { useLanguage } from '../contexts/LanguageContext';
import { useSimpleMode } from '../contexts/SimpleModeContext';
import { MenuButton } from '../components/MenuButton';
import { formatHijri } from '../utils/hijri';

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
  const { t, language } = useLanguage();
  const navigation = useNavigation();
  const { simpleMode, toggleSimpleMode, fs } = useSimpleMode();
  const hijri = formatHijri(new Date(), language);
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

  return (
    <View style={styles.root}>
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

      <NextEventCard />

      <TouchableOpacity
        style={styles.tasbihShortcut}
        onPress={() => (navigation as any).navigate('Tasbih')}
        activeOpacity={0.85}
      >
        <View style={styles.tasbihIconCircle}>
          <Text style={styles.tasbihIcon}>📿</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.tasbihTitle, { fontSize: fs(14) }]}>
            {language === 'ur' ? 'تسبیح کاؤنٹر' : language === 'ar' ? 'عدّاد التسبيح' : 'Tasbih Counter'}
          </Text>
          <Text style={[styles.tasbihSub, { fontSize: fs(12) }]}>
            {language === 'ur' ? 'ذکر کی گنتی رکھیں' : language === 'ar' ? 'احتسب أذكارك' : 'Track your dhikr'}
          </Text>
        </View>
        <Text style={styles.tasbihArrow}>›</Text>
      </TouchableOpacity>

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
            completed={g.completed}
            onToggle={() => toggleGoal(g.id)}
          />
        ))}
      </View>
    </ScrollView>
    <AdBanner unitId={AD_UNITS.bannerHome} />
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
