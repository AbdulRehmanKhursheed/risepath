import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MoodButton } from '../components/MoodButton';
import { ChatBubble } from '../components/ChatBubble';
import { AdBanner } from '../components/AdBanner';
import { AD_UNITS } from '../services/ads';
import { storage } from '../services/storage';
import { getLocalMotivation } from '../services/ai';
import { theme } from '../constants/theme';
import { useLanguage } from '../contexts/LanguageContext';

export function MoodScreen() {
  const { t } = useLanguage();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [messages, setMessages] = useState<string[]>([]);

  const handleMoodSelect = async (mood: number) => {
    setSelectedMood(mood);

    const prayers = await storage.getPrayers();
    const today = new Date().toISOString().split('T')[0];
    const todayPrayers = prayers[today];
    const missed = todayPrayers
      ? 5 -
        [
          todayPrayers.fajr,
          todayPrayers.dhuhr,
          todayPrayers.asr,
          todayPrayers.maghrib,
          todayPrayers.isha,
        ].filter(Boolean).length
      : 5;

    const streakData = await storage.getStreak();
    const streak = streakData?.current ?? 0;

    const response = getLocalMotivation(streak, mood, missed);
    setMessages([response]);

    const moods = await storage.getMoods();
    moods.unshift({ date: today, mood, aiResponse: response });
    await storage.setMoods(moods.slice(0, 50));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={['rgba(200, 120, 10, 0.07)', 'transparent']}
        style={styles.heroGradient}
        pointerEvents="none"
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t.moodCoach}</Text>
        <Text style={styles.subtitle}>{t.moodSubtitle}</Text>

        <View style={styles.moodRow}>
          {[1, 2, 3, 4, 5].map((m) => (
            <MoodButton
              key={m}
              mood={m}
              selected={selectedMood === m}
              onPress={() => handleMoodSelect(m)}
            />
          ))}
        </View>
        <View style={styles.moodLabels}>
          <Text style={styles.moodLabel}>{t.low}</Text>
          <Text style={styles.moodLabel}>{t.great}</Text>
        </View>

        <View style={styles.chat}>
          {messages.length === 0 && (
            <View style={styles.placeholderCard}>
              <Text style={styles.placeholderIcon}>🌿</Text>
              <Text style={styles.placeholder}>{t.moodPlaceholder}</Text>
            </View>
          )}
          {messages.map((msg, i) => (
            <ChatBubble key={i} message={msg} isUser={false} />
          ))}
        </View>

        <View style={styles.adWrap}>
          <AdBanner unitId={AD_UNITS.bannerMood} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.xl,
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.xxxl,
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
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  moodLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
    paddingHorizontal: 4,
  },
  moodLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBody,
  },
  chat: {
    marginTop: theme.spacing.md,
  },
  placeholderCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 32,
    marginBottom: theme.spacing.md,
  },
  placeholder: {
    color: theme.colors.textMuted,
    fontSize: 15,
    fontStyle: 'italic',
    textAlign: 'center',
    fontFamily: theme.typography.fontBody,
    lineHeight: 22,
  },
  adWrap: {
    marginTop: theme.spacing.xl,
    alignItems: 'center',
  },
});
