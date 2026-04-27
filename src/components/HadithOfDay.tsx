import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { theme } from '../constants/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useSimpleMode } from '../contexts/SimpleModeContext';
import { getDailyHadith } from '../constants/hadiths';

export function HadithOfDay() {
  const { language } = useLanguage();
  const { fs } = useSimpleMode();
  const hadith = useMemo(() => getDailyHadith(), []);
  // Arabic readers get the Arabic original (already shown above as the
  // primary text). The body line is the rendered translation in the user's
  // chosen reading language. Falling back to English for Arabic was a bug —
  // an Arabic user expects an Arabic translation if one exists, otherwise
  // the original is what's needed (which the `arabic` field already supplies).
  const body =
    language === 'ur'
      ? hadith.urdu
      : language === 'ar'
      ? (hadith as { arabic?: string; arabicTranslation?: string }).arabicTranslation ?? hadith.arabic
      : hadith.english;
  const label = language === 'ur' ? 'آج کی حدیث' : language === 'ar' ? 'حديث اليوم' : 'Hadith of the Day';

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={[styles.label, { fontSize: fs(10) }]}>{label}</Text>
        <Text style={[styles.source, { fontSize: fs(10) }]}>{hadith.source}</Text>
      </View>
      <Text style={styles.arabic}>{hadith.arabic}</Text>
      <Text style={[styles.body, { fontSize: fs(14), textAlign: language === 'ur' ? 'right' : 'left' }]}>
        {body}
      </Text>
      <Text style={[styles.narrator, { fontSize: fs(11) }]}>— {hadith.narrator} (RA)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.xxl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.success ?? '#1A7A3C',
    ...Platform.select({
      ios: {
        shadowColor: '#7A5A40',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.14,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  label: {
    fontFamily: theme.typography.fontBodyBold,
    color: theme.colors.success ?? '#1A7A3C',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  source: {
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },
  arabic: {
    fontSize: 20,
    color: theme.colors.text,
    textAlign: 'right',
    lineHeight: 34,
    marginBottom: theme.spacing.md,
    writingDirection: 'rtl',
  },
  body: {
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  narrator: {
    marginTop: 10,
    fontFamily: theme.typography.fontBodyMedium,
    color: theme.colors.accent,
    textAlign: 'right',
  },
});
