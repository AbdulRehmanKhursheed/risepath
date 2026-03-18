import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { UMRAH_STEPS } from '../constants/umrahGuide';
import { theme } from '../constants/theme';
import { useLanguage } from '../contexts/LanguageContext';

export function UmrahGuideScreen() {
  const { language } = useLanguage();
  const [expandedId, setExpandedId] = useState<number | null>(1);
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());
  const isUrdu = language === 'ur';

  const toggleComplete = (id: number) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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

      {/* Header */}
      <Text style={styles.title}>{isUrdu ? 'عمرہ گائیڈ' : 'Umrah Guide'}</Text>
      <Text style={styles.subtitle}>
        {isUrdu
          ? 'مرحلہ وار مکمل رہنمائی — دعاؤں اور ہدایات کے ساتھ'
          : 'Complete step-by-step guide with duas & instructions'}
      </Text>

      {/* Progress bar */}
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

      {/* Steps */}
      {UMRAH_STEPS.map((step, idx) => {
        const isExpanded = expandedId === step.id;
        const isDone = completedIds.has(step.id);
        const title = isUrdu ? step.titleUr : step.title;
        const description = isUrdu ? step.descriptionUr : step.description;

        return (
          <View key={step.id} style={styles.stepWrapper}>
            {/* Connector line */}
            {idx < UMRAH_STEPS.length - 1 && (
              <View style={[styles.connector, isDone && styles.connectorDone]} />
            )}

            {/* Step card */}
            <TouchableOpacity
              style={[styles.card, isDone && styles.cardDone, isExpanded && styles.cardExpanded]}
              onPress={() => setExpandedId(isExpanded ? null : step.id)}
              activeOpacity={0.85}
            >
              {/* Step header */}
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
                    {step.icon}{'  '}{isUrdu ? '' : step.phase}
                  </Text>
                  <Text style={[styles.stepTitle, isDone && styles.stepTitleDone]}>
                    {title}
                  </Text>
                </View>
                <Text style={styles.chevron}>{isExpanded ? '▲' : '▼'}</Text>
              </View>

              {/* Expanded body */}
              {isExpanded && (
                <View style={styles.cardBody}>
                  <Text style={styles.description}>{description}</Text>

                  {/* Dua */}
                  {step.dua && (
                    <View style={styles.duaCard}>
                      <Text style={styles.duaLabel}>{isUrdu ? 'دعا' : 'Dua'}</Text>
                      <Text style={styles.duaArabic}>{step.dua.arabic}</Text>
                      <Text style={styles.duaTranslit}>{step.dua.transliteration}</Text>
                      <Text style={styles.duaTrans}>
                        "{isUrdu ? step.dua.translationUr : step.dua.translation}"
                      </Text>
                    </View>
                  )}

                  {/* Tips */}
                  <View style={styles.tipsSection}>
                    <Text style={styles.tipsLabel}>{isUrdu ? 'اہم باتیں' : 'Key Points'}</Text>
                    {(isUrdu ? step.tipsUr : step.tips).map((tip, i) => (
                      <View key={i} style={styles.tipRow}>
                        <Text style={styles.tipDot}>•</Text>
                        <Text style={styles.tipText}>{tip}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Women's note */}
                  {step.womenNote && (
                    <View style={styles.womenNote}>
                      <Text style={styles.womenNoteIcon}>🌸</Text>
                      <Text style={styles.womenNoteText}>
                        {isUrdu ? 'خواتین کے لیے: ' : 'For women: '}
                        {step.womenNote}
                      </Text>
                    </View>
                  )}

                  {/* Mark done button */}
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

      {/* Footer note */}
      <View style={styles.footerNote}>
        <Text style={styles.footerText}>
          {isUrdu
            ? 'نوٹ: کسی مستند عالم سے رہنمائی حاصل کریں۔ یہ گائیڈ تعلیمی مقاصد کے لیے ہے۔'
            : 'Note: Always consult a qualified scholar for guidance. This guide is for educational purposes.'}
        </Text>
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
    left: 17,
    top: 52,
    width: 2,
    height: 24,
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
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
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
