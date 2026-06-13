import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Share,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { UMRAH_STEPS } from '../constants/umrahGuide';
import { theme } from '../constants/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { AdBanner } from '../components/AdBanner';
import { AD_UNITS } from '../services/ads';
import { ArabicText } from '../components/ui/ArabicText';

// Checklist progress must survive back-navigation and app restarts (this is
// a stack screen that unmounts on back). Keyed per guide.
const STORAGE_KEY = 'umrah_guide_completed_v1';

// The guide data (umrahGuide.ts) carries English-only phase strings; these
// are standard ritual terms, mapped to their conventional Urdu labels so the
// Before Travel / Ihram / Tawaf / Sa'i grouping isn't dropped in Urdu mode.
const PHASE_UR: Record<string, string> = {
  'Before Travel': 'سفر سے پہلے',
  'Ihram': 'احرام',
  'Arriving in Makkah': 'مکہ آمد',
  'Tawaf': 'طواف',
  'Zamzam': 'زم زم',
  "Sa'i": 'سعی',
  'Completion': 'تکمیل',
};

export function UmrahGuideScreen() {
  const { language } = useLanguage();
  const [expandedId, setExpandedId] = useState<number | null>(1);
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());
  const isUrdu = language === 'ur';

  // Set once the AsyncStorage read settles. Until then, toggles are kept
  // in memory but NOT persisted — otherwise a tap racing the read would
  // write a one-item array over previously saved checklist progress.
  const hydratedRef = useRef(false);

  // Restore persisted checkmarks on mount, merging with (not replacing) any
  // toggles made before the read resolved, so a fast first tap is neither
  // visually reverted by late hydration nor allowed to wipe saved progress.
  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!mounted) return;
        let stored: number[] = [];
        try {
          const parsed = raw ? JSON.parse(raw) : [];
          if (Array.isArray(parsed)) {
            stored = parsed.filter((x) => typeof x === 'number');
          }
        } catch {}
        hydratedRef.current = true;
        setCompletedIds((prev) => {
          const merged = new Set<number>(stored);
          prev.forEach((id) => merged.add(id));
          // Persist the merge if pre-hydration taps happened, so storage
          // reflects them too (their own persist was skipped).
          if (prev.size > 0) {
            AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(merged))).catch(() => {});
          }
          return merged;
        });
      })
      .catch(() => {
        if (mounted) hydratedRef.current = true;
      });
    return () => { mounted = false; };
  }, []);

  const toggleComplete = (id: number) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      // Best-effort persist — never block the checkmark on storage. Skipped
      // pre-hydration (the hydration merge persists those taps instead).
      if (hydratedRef.current) {
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next))).catch(() => {});
      }
      return next;
    });
  };

  const onCopyDua = async (arabic: string) => {
    try {
      await Clipboard.setStringAsync(arabic);
      Alert.alert('', isUrdu ? '✓ کاپی ہو گیا' : '✓ Copied to clipboard');
    } catch {
      Alert.alert(
        isUrdu ? 'خرابی' : 'Error',
        isUrdu ? 'کاپی نہیں ہو سکا' : 'Could not copy'
      );
    }
  };

  const completedCount = completedIds.size;
  const totalCount = UMRAH_STEPS.length;
  const progressPct = Math.round((completedCount / totalCount) * 100);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={['rgba(26, 122, 60, 0.1)', 'transparent']}
        style={styles.heroGradient}
        pointerEvents="none"
      />

      <Text style={styles.title}>{isUrdu ? 'عمرہ گائیڈ' : 'Umrah Guide'}</Text>
      <Text style={styles.subtitle}>
        {isUrdu
          ? 'مرحلہ وار مکمل رہنمائی — دعاؤں اور ہدایات کے ساتھ'
          : 'Complete step-by-step guide with duas & instructions'}
      </Text>

      <View style={styles.progressCard}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>
            {isUrdu ? 'پیشرفت' : 'Progress'}
          </Text>
          <Text style={styles.progressCount}>
            {completedCount}/{totalCount} {isUrdu ? 'مراحل' : 'steps'}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
        </View>
        {completedCount === totalCount && (
          <Text style={styles.completedBanner}>
            {isUrdu ? '🎉 مبارک ہو! آپ کا عمرہ مکمل ہو گیا' : '🎉 Masha Allah! Umrah complete — may it be accepted!'}
          </Text>
        )}
      </View>

      {UMRAH_STEPS.map((step, idx) => {
        const isExpanded = expandedId === step.id;
        const isDone = completedIds.has(step.id);
        const title = isUrdu ? step.titleUr : step.title;
        const description = isUrdu ? step.descriptionUr : step.description;

        return (
          <View key={step.id} style={styles.stepWrapper}>
            {idx < UMRAH_STEPS.length - 1 && (
              <View style={[styles.connector, isDone && styles.connectorDone]} />
            )}

            <TouchableOpacity
              style={[styles.card, isDone && styles.cardDone, isExpanded && styles.cardExpanded]}
              onPress={() => setExpandedId(isExpanded ? null : step.id)}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.stepBubble, isDone && styles.stepBubbleDone]}>
                  {isDone ? (
                    <Text style={styles.stepBubbleDoneText}>✓</Text>
                  ) : (
                    <Text style={styles.stepBubbleText}>{step.id}</Text>
                  )}
                </View>
                <View style={styles.stepMeta}>
                  <Text style={styles.phaseLabel}>
                    {step.icon}{'  '}{isUrdu ? PHASE_UR[step.phase] ?? step.phase : step.phase}
                  </Text>
                  <Text style={[styles.stepTitle, isDone && styles.stepTitleDone]}>
                    {title}
                  </Text>
                </View>
                <Text style={styles.chevron}>{isExpanded ? '▲' : '▼'}</Text>
              </View>

              {isExpanded && (
                <View style={styles.cardBody}>
                  <Text style={styles.description}>{description}</Text>

                  {step.dua && (
                    <View style={styles.duaCard}>
                      <View style={styles.duaHeader}>
                        <Text style={styles.duaLabel}>{isUrdu ? 'دعا' : 'Dua'}</Text>
                        <View style={styles.duaActions}>
                          <TouchableOpacity
                            style={styles.duaAction}
                            onPress={() => onCopyDua(step.dua!.arabic)}
                            accessibilityLabel={isUrdu ? 'عربی کاپی کریں' : 'Copy Arabic'}
                          >
                            <Text style={styles.duaActionText}>📋 {isUrdu ? 'کاپی' : 'Copy'}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.duaAction}
                            onPress={() =>
                              Share.share({
                                message: `${step.dua!.arabic}\n\n${step.dua!.transliteration}\n\n"${
                                  isUrdu ? step.dua!.translationUr : step.dua!.translation
                                }"`,
                              })
                            }
                            accessibilityLabel={isUrdu ? 'شیئر کریں' : 'Share'}
                          >
                            <Text style={styles.duaActionText}>📤 {isUrdu ? 'شیئر' : 'Share'}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      <ArabicText style={styles.duaArabic}>{step.dua.arabic}</ArabicText>
                      <Text style={styles.duaTranslit}>{step.dua.transliteration}</Text>
                      <Text style={styles.duaTrans}>
                        "{isUrdu ? step.dua.translationUr : step.dua.translation}"
                      </Text>
                    </View>
                  )}

                  <View style={styles.tipsSection}>
                    <Text style={styles.tipsLabel}>{isUrdu ? 'اہم باتیں' : 'Key Points'}</Text>
                    {(isUrdu ? step.tipsUr : step.tips).map((tip, i) => (
                      <View key={i} style={styles.tipRow}>
                        <Text style={styles.tipDot}>•</Text>
                        <Text style={styles.tipText}>{tip}</Text>
                      </View>
                    ))}
                  </View>

                  {step.womenNote && (
                    <View style={styles.womenNote}>
                      <Text style={styles.womenNoteIcon}>🌸</Text>
                      <Text style={styles.womenNoteText}>
                        {isUrdu ? 'خواتین کے لیے: ' : 'For women: '}
                        {step.womenNote}
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.doneBtn, isDone && styles.doneBtnActive]}
                    onPress={() => toggleComplete(step.id)}
                  >
                    <Text style={[styles.doneBtnText, isDone && styles.doneBtnTextActive]}>
                      {isDone
                        ? (isUrdu ? '✓ مکمل ہو گیا' : '✓ Completed')
                        : (isUrdu ? 'مکمل نشان زد کریں' : 'Mark as Complete')}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          </View>
        );
      })}

      <View style={styles.footerNote}>
        <Text style={styles.footerText}>
          {isUrdu
            ? 'نوٹ: کسی مستند عالم سے رہنمائی حاصل کریں۔ یہ گائیڈ تعلیمی مقاصد کے لیے ہے۔'
            : 'Note: Always consult a qualified scholar for guidance. This guide is for educational purposes.'}
        </Text>
      </View>
      <AdBanner unitId={AD_UNITS.bannerGuides} />
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
    height: 220,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: theme.typography.fontHeadingBold,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 6,
    marginBottom: theme.spacing.xl,
    fontFamily: theme.typography.fontBody,
    lineHeight: 20,
  },
  progressCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...Platform.select({
      ios: { shadowColor: '#7A5A40', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 14,
    fontFamily: theme.typography.fontBodyMedium,
    color: theme.colors.textMuted,
  },
  progressCount: {
    fontSize: 14,
    fontFamily: theme.typography.fontBodyBold,
    color: theme.colors.success,
  },
  progressTrack: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    backgroundColor: theme.colors.success,
    borderRadius: 4,
  },
  completedBanner: {
    marginTop: 10,
    fontSize: 14,
    color: theme.colors.success,
    fontFamily: theme.typography.fontBodyBold,
    textAlign: 'center',
  },
  stepWrapper: {
    position: 'relative',
    marginBottom: theme.spacing.sm,
  },
  connector: {
    position: 'absolute',
    // 33 = cardHeader padding (16) + stepBubble radius (18) - connector half-width (1)
    left: 33,
    top: 54,
    width: 2,
    height: 18,
    backgroundColor: theme.colors.border,
    zIndex: 0,
  },
  connectorDone: {
    backgroundColor: theme.colors.success,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#7A5A40', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  cardDone: {
    borderColor: 'rgba(26, 122, 60, 0.35)',
    backgroundColor: 'rgba(26, 122, 60, 0.03)',
  },
  cardExpanded: {
    borderColor: theme.colors.accent,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  stepBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.accent,
  },
  stepBubbleDone: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  stepBubbleText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.accent,
    fontFamily: theme.typography.fontBodyBold,
  },
  stepBubbleDoneText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
  stepMeta: {
    flex: 1,
  },
  phaseLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBody,
    marginBottom: 2,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    fontFamily: theme.typography.fontBodyBold,
    lineHeight: 20,
  },
  stepTitleDone: {
    color: theme.colors.success,
  },
  chevron: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  cardBody: {
    padding: theme.spacing.lg,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSoft,
  },
  description: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontBody,
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  duaCard: {
    backgroundColor: theme.colors.backgroundSoft,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.success,
    borderWidth: 1,
    borderColor: 'rgba(26, 122, 60, 0.15)',
    marginBottom: theme.spacing.lg,
  },
  duaLabel: {
    fontSize: 11,
    color: theme.colors.success,
    fontFamily: theme.typography.fontBodyBold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  duaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  duaActions: { flexDirection: 'row', gap: 6 },
  duaAction: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: theme.borderRadius.full, backgroundColor: theme.colors.accentMuted },
  duaActionText: { fontSize: 11, color: theme.colors.accent, fontFamily: theme.typography.fontBodyMedium },
  duaArabic: {
    fontSize: 20,
    color: theme.colors.text,
    textAlign: 'right',
    lineHeight: 34,
    marginBottom: 8,
    fontFamily: theme.typography.fontBody,
  },
  duaTranslit: {
    fontSize: 13,
    color: theme.colors.accent,
    fontStyle: 'italic',
    fontFamily: theme.typography.fontBody,
    marginBottom: 6,
    lineHeight: 20,
  },
  duaTrans: {
    fontSize: 13,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBody,
    lineHeight: 20,
  },
  tipsSection: {
    marginBottom: theme.spacing.lg,
  },
  tipsLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBodyBold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 5,
  },
  tipDot: {
    fontSize: 14,
    color: theme.colors.accent,
    lineHeight: 20,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontBody,
    lineHeight: 20,
  },
  womenNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(200, 120, 10, 0.06)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    gap: 8,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.accentMuted,
  },
  womenNoteIcon: {
    fontSize: 14,
    lineHeight: 20,
  },
  womenNoteText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBody,
    lineHeight: 20,
  },
  doneBtn: {
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.success,
    alignItems: 'center',
  },
  doneBtnActive: {
    backgroundColor: theme.colors.success,
  },
  doneBtnText: {
    fontSize: 14,
    fontFamily: theme.typography.fontBodyBold,
    color: theme.colors.success,
  },
  doneBtnTextActive: {
    color: '#fff',
  },
  footerNote: {
    marginTop: theme.spacing.xl,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  footerText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBody,
    textAlign: 'center',
    lineHeight: 18,
  },
});
