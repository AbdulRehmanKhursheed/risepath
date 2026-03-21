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
import { JANAZA_PHASES } from '../constants/janazaGuide';
import type { JanazaStep } from '../constants/janazaGuide';
import { theme } from '../constants/theme';
import { useLanguage } from '../contexts/LanguageContext';

type CompletedKey = string; // step.id

export function JanazaScreen() {
  const { language } = useLanguage();
  const isUrdu = language === 'ur';

  const [expandedPhase, setExpandedPhase] = useState<number | null>(1);
  const [expandedStep, setExpandedStep] = useState<string | null>('1.1');
  const [completedIds, setCompletedIds] = useState<Set<CompletedKey>>(new Set());

  const allCheckable = JANAZA_PHASES.flatMap((ph) =>
    ph.steps.filter((s) => s.checkable)
  );
  const completedCount = allCheckable.filter((s) => completedIds.has(s.id)).length;
  const totalCount = allCheckable.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const toggleComplete = (id: CompletedKey) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={['rgba(50, 50, 90, 0.10)', 'transparent']}
        style={styles.heroGradient}
        pointerEvents="none"
      />

      {/* Header */}
      <Text style={styles.title}>{isUrdu ? 'جنازہ گائیڈ' : 'Janaza Guide'}</Text>
      <Text style={styles.subtitle}>
        {isUrdu
          ? 'مکمل مرحلہ وار رہنمائی — ماخذ کے ساتھ'
          : 'Complete step-by-step guide with sources'}
      </Text>

      {/* Disclaimer */}
      <View style={styles.disclaimerCard}>
        <Text style={styles.disclaimerIcon}>📚</Text>
        <Text style={styles.disclaimerText}>
          {isUrdu
            ? 'یہ رہنمائی علمی ذرائع پر مبنی ہے۔ اپنے مقامی عالم یا امام سے رجوع کریں۔ شیعہ (جعفری) فقہ کے فرق واضح نشان کے ساتھ درج ہیں۔'
            : 'Based on Bukhari, Muslim, Abu Dawud & classical fiqh. Consult your local scholar. Shia (Jafari) differences are clearly noted.'}
        </Text>
      </View>

      {/* Progress */}
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
        {completedCount === totalCount && totalCount > 0 && (
          <Text style={styles.completedBanner}>
            {isUrdu
              ? 'اللہ تعالیٰ قبول فرمائے۔ اللہ مرحوم کی مغفرت فرمائے۔'
              : 'May Allah accept your service. May the deceased be forgiven.'}
          </Text>
        )}
      </View>

      {/* Phases */}
      {JANAZA_PHASES.map((phase) => {
        const isPhaseDone = phase.steps
          .filter((s) => s.checkable)
          .every((s) => completedIds.has(s.id));
        const phaseTitle = isUrdu ? phase.phaseUr : phase.phase;

        return (
          <View key={phase.id} style={styles.phaseBlock}>
            {/* Phase Header */}
            <TouchableOpacity
              style={[styles.phaseHeader, isPhaseDone && styles.phaseHeaderDone]}
              onPress={() =>
                setExpandedPhase(expandedPhase === phase.id ? null : phase.id)
              }
              activeOpacity={0.8}
            >
              <View style={styles.phaseLeft}>
                <View style={[styles.phaseBubble, isPhaseDone && styles.phaseBubbleDone]}>
                  <Text style={styles.phaseBubbleText}>
                    {isPhaseDone ? '✓' : phase.id}
                  </Text>
                </View>
                <View>
                  <Text style={styles.phaseAr}>{phase.phaseAr}</Text>
                  <Text style={[styles.phaseTitle, isPhaseDone && styles.phaseTitleDone]}>
                    {phaseTitle}
                  </Text>
                </View>
              </View>
              <Text style={styles.chevron}>
                {expandedPhase === phase.id ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {/* Steps */}
            {expandedPhase === phase.id &&
              phase.steps.map((step) => (
                <StepCard
                  key={step.id}
                  step={step}
                  isUrdu={isUrdu}
                  isExpanded={expandedStep === step.id}
                  isDone={completedIds.has(step.id)}
                  onToggleExpand={() =>
                    setExpandedStep(expandedStep === step.id ? null : step.id)
                  }
                  onToggleDone={() => toggleComplete(step.id)}
                />
              ))}
          </View>
        );
      })}

      {/* Footer */}
      <View style={styles.footerNote}>
        <Text style={styles.footerText}>
          {isUrdu
            ? 'مآخذ: صحیح بخاری، صحیح مسلم، سنن ابو داؤد، سنن ترمذی، ابن ماجہ — مستند فقہی کتب سے۔\nیہ گائیڈ تعلیمی مقاصد کے لیے ہے۔ فتویٰ کے لیے مستند عالم سے رجوع کریں۔'
            : 'Sources: Sahih Bukhari, Sahih Muslim, Sunan Abu Dawud, Tirmidhi, Ibn Majah — verified classical fiqh.\nThis guide is for educational purposes. Consult a qualified scholar for rulings.'}
        </Text>
      </View>
    </ScrollView>
  );
}

/* ── Step Card component ── */
type StepCardProps = {
  step: JanazaStep;
  isUrdu: boolean;
  isExpanded: boolean;
  isDone: boolean;
  onToggleExpand: () => void;
  onToggleDone: () => void;
};

function StepCard({
  step,
  isUrdu,
  isExpanded,
  isDone,
  onToggleExpand,
  onToggleDone,
}: StepCardProps) {
  const title = isUrdu ? step.titleUr : step.title;
  const description = isUrdu ? step.descriptionUr : step.description;

  return (
    <TouchableOpacity
      style={[
        styles.stepCard,
        isDone && styles.stepCardDone,
        step.important && styles.stepCardImportant,
        isExpanded && styles.stepCardExpanded,
      ]}
      onPress={onToggleExpand}
      activeOpacity={0.85}
    >
      {/* Step header row */}
      <View style={styles.stepHeader}>
        <View style={styles.stepLeft}>
          <View style={[styles.stepDot, isDone && styles.stepDotDone, step.important && styles.stepDotImportant]}>
            {isDone ? (
              <Text style={styles.stepDotTextDone}>✓</Text>
            ) : (
              <Text style={[styles.stepDotText, step.important && styles.stepDotTextImportant]}>
                {step.id}
              </Text>
            )}
          </View>
          <Text
            style={[styles.stepTitle, isDone && styles.stepTitleDone]}
            numberOfLines={isExpanded ? undefined : 2}
          >
            {title}
          </Text>
        </View>
        <Text style={styles.chevronSm}>{isExpanded ? '▲' : '▼'}</Text>
      </View>

      {/* Expanded body */}
      {isExpanded && (
        <View style={styles.stepBody}>
          <Text style={styles.description}>{description}</Text>

          {/* Arabic / Dua block */}
          {step.arabic && (
            <View style={styles.arabicCard}>
              <Text style={styles.arabicLabel}>
                {isUrdu ? 'متن' : 'Text'}
              </Text>
              <Text style={styles.arabicText}>{step.arabic}</Text>
              {step.transliteration && (
                <Text style={styles.translitText}>{step.transliteration}</Text>
              )}
              {(step.translation || step.translationUr) && (
                <Text style={styles.translationText}>
                  "{isUrdu && step.translationUr ? step.translationUr : step.translation}"
                </Text>
              )}
            </View>
          )}

          {/* Source */}
          {step.source && (
            <View style={styles.sourceRow}>
              <Text style={styles.sourceIcon}>📖</Text>
              <Text style={styles.sourceText}>{step.source}</Text>
            </View>
          )}

          {/* Shia / Jafari note */}
          {step.shiaNote && (
            <View style={styles.shiaNote}>
              <Text style={styles.shiaIcon}>🌙</Text>
              <View style={styles.shiaContent}>
                <Text style={styles.shiaLabel}>
                  {isUrdu ? 'جعفری فقہ' : 'Jafari (Shia)'}
                </Text>
                <Text style={styles.shiaText}>{step.shiaNote}</Text>
              </View>
            </View>
          )}

          {/* Mark done button — only for checkable steps */}
          {step.checkable && (
            <TouchableOpacity
              style={[styles.doneBtn, isDone && styles.doneBtnActive]}
              onPress={onToggleDone}
            >
              <Text style={[styles.doneBtnText, isDone && styles.doneBtnTextActive]}>
                {isDone
                  ? (isUrdu ? '✓ مکمل ہو گیا' : '✓ Done')
                  : (isUrdu ? 'مکمل نشان زد کریں' : 'Mark as Done')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
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
    height: 260,
  },
  title: {
    fontSize: 28,
    color: theme.colors.text,
    fontFamily: theme.typography.fontHeading,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBody,
    marginBottom: theme.spacing.xl,
    lineHeight: 20,
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(100, 80, 200, 0.07)',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(100, 80, 200, 0.18)',
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  disclaimerIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontBody,
    lineHeight: 18,
  },
  progressCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xxl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 13,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBodyBold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  progressCount: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontBody,
  },
  progressTrack: {
    height: 6,
    backgroundColor: theme.colors.backgroundSoft,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.accent,
    borderRadius: 3,
  },
  completedBanner: {
    marginTop: 10,
    fontSize: 13,
    color: theme.colors.success,
    fontFamily: theme.typography.fontBody,
    textAlign: 'center',
    lineHeight: 20,
  },
  phaseBlock: {
    marginBottom: theme.spacing.lg,
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
    }),
  },
  phaseHeaderDone: {
    borderColor: theme.colors.success,
    backgroundColor: 'rgba(26, 122, 60, 0.05)',
  },
  phaseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  phaseBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.backgroundSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  phaseBubbleDone: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  phaseBubbleText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontBodyBold,
  },
  phaseAr: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBody,
    marginBottom: 2,
  },
  phaseTitle: {
    fontSize: 15,
    color: theme.colors.text,
    fontFamily: theme.typography.fontHeadingBold,
  },
  phaseTitleDone: {
    color: theme.colors.success,
  },
  chevron: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginLeft: 8,
  },
  stepCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 6,
    marginLeft: 8,
    overflow: 'hidden',
  },
  stepCardDone: {
    borderColor: 'rgba(26, 122, 60, 0.35)',
    backgroundColor: 'rgba(26, 122, 60, 0.03)',
  },
  stepCardImportant: {
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.accent,
  },
  stepCardExpanded: {
    borderColor: theme.colors.border,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    gap: 8,
  },
  stepLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.backgroundSoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepDotDone: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  stepDotImportant: {
    borderColor: theme.colors.accent,
  },
  stepDotText: {
    fontSize: 9,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBodyBold,
  },
  stepDotTextDone: {
    fontSize: 12,
    color: '#fff',
    fontFamily: theme.typography.fontBodyBold,
  },
  stepDotTextImportant: {
    color: theme.colors.accent,
  },
  stepTitle: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    fontFamily: theme.typography.fontBody,
    lineHeight: 20,
  },
  stepTitleDone: {
    color: theme.colors.success,
  },
  chevronSm: {
    fontSize: 10,
    color: theme.colors.textMuted,
    flexShrink: 0,
  },
  stepBody: {
    padding: theme.spacing.md,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSoft,
  },
  description: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontBody,
    lineHeight: 21,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  arabicCard: {
    backgroundColor: theme.colors.backgroundSoft,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(100, 80, 200, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(100, 80, 200, 0.12)',
    marginBottom: theme.spacing.md,
  },
  arabicLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBodyBold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  arabicText: {
    fontSize: 20,
    color: theme.colors.text,
    textAlign: 'right',
    lineHeight: 36,
    marginBottom: 8,
    fontFamily: theme.typography.fontBody,
  },
  translitText: {
    fontSize: 12,
    color: theme.colors.accent,
    fontStyle: 'italic',
    fontFamily: theme.typography.fontBody,
    marginBottom: 6,
    lineHeight: 18,
  },
  translationText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBody,
    lineHeight: 18,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: theme.spacing.sm,
  },
  sourceIcon: {
    fontSize: 12,
    marginTop: 1,
  },
  sourceText: {
    flex: 1,
    fontSize: 11,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBody,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  shiaNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(0, 70, 130, 0.06)',
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(0, 70, 130, 0.14)',
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  shiaIcon: {
    fontSize: 14,
    marginTop: 1,
  },
  shiaContent: {
    flex: 1,
  },
  shiaLabel: {
    fontSize: 10,
    color: 'rgba(0, 70, 160, 0.8)',
    fontFamily: theme.typography.fontBodyBold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  shiaText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontBody,
    lineHeight: 17,
  },
  doneBtn: {
    marginTop: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    paddingVertical: 8,
    alignItems: 'center',
  },
  doneBtnActive: {
    borderColor: theme.colors.success,
    backgroundColor: 'rgba(26, 122, 60, 0.08)',
  },
  doneBtnText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBody,
  },
  doneBtnTextActive: {
    color: theme.colors.success,
    fontFamily: theme.typography.fontBodyBold ?? theme.typography.fontBody,
  },
  footerNote: {
    marginTop: theme.spacing.xl,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.backgroundSoft,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  footerText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBody,
    lineHeight: 17,
    textAlign: 'center',
  },
});
