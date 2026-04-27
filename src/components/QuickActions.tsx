import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../constants/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useSimpleMode } from '../contexts/SimpleModeContext';

type QuickAction = {
  key: 'quran' | 'duas' | 'tasbih' | 'qibla';
  icon: string;
  labelEn: string;
  labelUr: string;
  labelAr: string;
};

const ACTIONS: QuickAction[] = [
  { key: 'quran',  icon: '📖', labelEn: 'Quran',  labelUr: 'قرآن',  labelAr: 'القرآن' },
  { key: 'duas',   icon: '🤲', labelEn: 'Dua',    labelUr: 'دعا',   labelAr: 'دعاء' },
  { key: 'tasbih', icon: '📿', labelEn: 'Tasbih', labelUr: 'تسبیح', labelAr: 'تسبيح' },
  { key: 'qibla',  icon: '🧭', labelEn: 'Qibla',  labelUr: 'قبلہ',  labelAr: 'القبلة' },
];

// Four-tile quick-access row. Surfaces the four highest-frequency daily
// actions in one tap. Quran is a tab, the others are stack screens — handled
// in the navigate switch below.
export function QuickActions() {
  const { language } = useLanguage();
  const { fs } = useSimpleMode();
  const navigation = useNavigation();
  const isUrdu = language === 'ur';
  const isArabic = language === 'ar';

  const navigate = (key: QuickAction['key']) => {
    switch (key) {
      case 'quran':
        (navigation as any).navigate('MainTabs', { screen: 'Quran' });
        break;
      case 'duas':
        (navigation as any).navigate('Duas');
        break;
      case 'tasbih':
        (navigation as any).navigate('Tasbih');
        break;
      case 'qibla':
        (navigation as any).navigate('Qibla');
        break;
    }
  };

  return (
    <View style={styles.row}>
      {ACTIONS.map((a) => (
        <TouchableOpacity
          key={a.key}
          style={styles.tile}
          onPress={() => navigate(a.key)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={isUrdu ? a.labelUr : isArabic ? a.labelAr : a.labelEn}
        >
          <View style={styles.iconCircle}>
            <Text style={styles.icon}>{a.icon}</Text>
          </View>
          <Text style={[styles.label, { fontSize: fs(11) }]} numberOfLines={1}>
            {isUrdu ? a.labelUr : isArabic ? a.labelAr : a.labelEn}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  tile: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    gap: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#7A5A40',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
    }),
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
  },
  label: {
    fontFamily: theme.typography.fontBodyMedium,
    color: theme.colors.textSecondary,
  },
});
