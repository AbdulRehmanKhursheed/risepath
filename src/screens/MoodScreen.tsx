import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MoodButton } from '../components/MoodButton';
import { ChatBubble } from '../components/ChatBubble';
import { AdBanner } from '../components/AdBanner';
import { AD_UNITS } from '../services/ads';
import { storage } from '../services/storage';
import { getLocalMotivation } from '../services/ai';
import { theme } from '../constants/theme';
import { computeStreak } from '../utils/streak';
import { useLanguage } from '../contexts/LanguageContext';
import { getLocalDateKey } from '../utils/date';
import { captureError } from '../services/sentry';

// Inline labels (same pattern as HifzScreen/TasbihScreen) — translations.ts
// is owned elsewhere, and this string is Mood-only.
const SAVE_FAILED_NOTE: Record<'en' | 'ur' | 'ar', string> = {
  en: "Your mood couldn't be saved this time, so it won't count toward your stats — but the reflection above is still yours.",
  ur: 'آپ کا موڈ اس بار محفوظ نہیں ہو سکا، اس لیے یہ اعداد و شمار میں شمار نہیں ہوگا — لیکن اوپر کا پیغام آپ کے لیے ہے۔',
  ar: 'تعذر حفظ مزاجك هذه المرة، لذا لن يُحتسب في الإحصائيات — لكن الرسالة أعلاه تبقى لك.',
};

export function MoodScreen() {
  const { t, language } = useLanguage();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  // Surfaced via the chat area while the response is being computed. Without
  // this, the user taps a mood and stares at a static screen for ~200-500ms
  // while storage reads + streak compute + write run. Showing the "thinking"
  // bubble immediately makes the screen feel responsive.
  const [thinking, setThinking] = useState(false);
  // Lock to coalesce rapid double-taps. Two concurrent submissions both
  // `getMoods()` from the same snapshot, both unshift, and the second write
  // wins — silently dropping the first entry. The ref guard prevents that
  // by short-circuiting any submission while one is already in flight.
  const submittingRef = useRef(false);

  const handleMoodSelect = async (mood: number) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSelectedMood(mood);
    setThinking(true);
    setMessages([]); // clear any prior response so the spinner is the only thing on screen

    const today = getLocalDateKey();
    try {
      // The prayer/streak read only personalizes the response — if it fails
      // (AsyncStorage I/O), fall back to neutral inputs rather than leaving
      // the user staring at an empty chat. Previously this whole handler was
      // try/finally with no catch: the rejection escaped unhandled, the
      // spinner vanished, and nothing was shown or saved.
      let streak = 0;
      let missed = 0;
      try {
        const prayers = await storage.getPrayers();
        const todayPrayers = prayers[today];
        missed = todayPrayers
          ? 5 -
            [
              todayPrayers.fajr,
              todayPrayers.dhuhr,
              todayPrayers.asr,
              todayPrayers.maghrib,
              todayPrayers.isha,
            ].filter(Boolean).length
          : 5;

        // `prayers` already loaded above — reuse it instead of a second read.
        const { current } = computeStreak(prayers);
        streak = current;
      } catch (err) {
        captureError(err, { scope: 'mood:read-prayers' });
      }

      const response = getLocalMotivation(streak, mood, missed);
      setMessages([response]);

      try {
        const moods = await storage.getMoods();
        moods.unshift({ date: today, mood, aiResponse: response });
        await storage.setMoods(moods.slice(0, 50));
      } catch (err) {
        // The response is already on screen — keep it, but tell the user the
        // entry didn't persist instead of failing silently.
        captureError(err, { scope: 'mood:save' });
        setMessages([response, SAVE_FAILED_NOTE[language] ?? SAVE_FAILED_NOTE.en]);
      }
    } finally {
      submittingRef.current = false;
      setThinking(false);
    }
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
          {!thinking && messages.length === 0 && (
            <View style={styles.placeholderCard}>
              <Text style={styles.placeholderIcon}>🌿</Text>
              <Text style={styles.placeholder}>{t.moodPlaceholder}</Text>
            </View>
          )}
          {thinking && (
            <View style={styles.thinkingRow}>
              <ActivityIndicator size="small" color={theme.colors.accent} />
              <Text style={styles.thinkingText}>{t.coachThinking}</Text>
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
  thinkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  thinkingText: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBody,
    fontSize: 14,
    fontStyle: 'italic',
  },
  adWrap: {
    marginTop: theme.spacing.xl,
    alignItems: 'center',
  },
});
