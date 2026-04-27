import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AdBanner } from '../components/AdBanner';
import { storage } from '../services/storage';
import { theme } from '../constants/theme';
import { AD_UNITS } from '../services/ads';
import { useLanguage } from '../contexts/LanguageContext';
import { computeStreak } from '../utils/streak';
import { getLocalDateKey } from '../utils/date';

export function StatsScreen() {
  const { t } = useLanguage();
  const [streak, setStreak] = useState(0);
  const [longest, setLongest] = useState(0);
  const [prayerConsistency, setPrayerConsistency] = useState(0);
  const [goalsThisWeek, setGoalsThisWeek] = useState(0);
  const [moodAvg, setMoodAvg] = useState(0);

  useEffect(() => {
    (async () => {
      const prayers = await storage.getPrayers();
      const { current, longest } = computeStreak(prayers);
      setStreak(current);
      setLongest(longest);

      const now = new Date();
      let prayed = 0;
      let total = 0;
      for (let i = 0; i < 7; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const key = getLocalDateKey(d);
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

      const goals = await storage.getGoals();
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const completed = goals.filter(
        (g) => g.completed && g.date && new Date(g.date) >= weekAgo
      );
      setGoalsThisWeek(completed.length);

      const moods = await storage.getMoods();
      const recentMoods = moods.slice(0, 7).filter((m) => m.mood);
      const avg =
        recentMoods.length > 0
          ? recentMoods.reduce((s, m) => s + m.mood, 0) / recentMoods.length
          : 0;
      setMoodAvg(Math.round(avg * 10) / 10);
    })();
  }, []);

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
