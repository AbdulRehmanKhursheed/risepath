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
import { KALIMAS, DUAS } from '../constants/kalimasAndDuas';
import { theme } from '../constants/theme';
import { useLanguage } from '../contexts/LanguageContext';

type Section = 'kalimas' | 'duas';

export function LearnScreen() {
  const { t } = useLanguage();
  const [section, setSection] = useState<Section>('kalimas');
  const [expandedKalima, setExpandedKalima] = useState<number | null>(1);
  const [expandedDua, setExpandedDua] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(200, 120, 10, 0.09)', 'transparent']}
        style={styles.heroGradient}
        pointerEvents="none"
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t.learn}</Text>
        <Text style={styles.subtitle}>{t.kalimasAndDuas}</Text>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, section === 'kalimas' && styles.tabActive]}
            onPress={() => setSection('kalimas')}
          >
            <Text style={[styles.tabText, section === 'kalimas' && styles.tabTextActive]}>
              {t.kalimas}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, section === 'duas' && styles.tabActive]}
            onPress={() => setSection('duas')}
          >
            <Text style={[styles.tabText, section === 'duas' && styles.tabTextActive]}>
              {t.duas}
            </Text>
          </TouchableOpacity>
        </View>

        {section === 'kalimas' && (
          <View style={styles.section}>
            {KALIMAS.map((k) => (
              <TouchableOpacity
                key={k.id}
                style={styles.card}
                onPress={() =>
                  setExpandedKalima(expandedKalima === k.id ? null : k.id)
                }
                activeOpacity={0.9}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardNumber}>{k.id}</Text>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle}>{k.name}</Text>
                    <Text style={styles.cardTitleAr}>{k.nameAr}</Text>
                  </View>
                  <Text style={styles.expandIcon}>
                    {expandedKalima === k.id ? '▼' : '▶'}
                  </Text>
                </View>
                {expandedKalima === k.id && (
                  <View style={styles.cardBody}>
                    <Text style={styles.arabic}>{k.arabic}</Text>
                    <Text style={styles.transliteration}>{k.transliteration}</Text>
                    <Text style={styles.translation}>"{k.translation}"</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {section === 'duas' && (
          <View style={styles.section}>
            <Text style={styles.sectionHint}>{t.tapDuaToExpand}</Text>
            {DUAS.map((d) => (
              <TouchableOpacity
                key={d.id}
                style={styles.card}
                onPress={() =>
                  setExpandedDua(expandedDua === d.id ? null : d.id)
                }
                activeOpacity={0.9}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle}>{d.title}</Text>
                    <Text style={styles.cardWhen}>{d.when}</Text>
                  </View>
                  <Text style={styles.expandIcon}>
                    {expandedDua === d.id ? '▼' : '▶'}
                  </Text>
                </View>
                {expandedDua === d.id && (
                  <View style={styles.cardBody}>
                    <Text style={styles.arabic}>{d.arabic}</Text>
                    <Text style={styles.transliteration}>{d.transliteration}</Text>
                    <Text style={styles.translation}>"{d.translation}"</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
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
    height: 200,
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
  tabs: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
  },
  tabActive: {
    backgroundColor: theme.colors.accent,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBodyBold,
  },
  tabTextActive: {
    color: '#fff',
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionHint: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.lg,
    fontFamily: theme.typography.fontBody,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#7A5A40',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  cardNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.accentMuted,
    color: theme.colors.accent,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
    marginRight: theme.spacing.md,
    fontFamily: theme.typography.fontBodyBold,
  },
  cardTitleRow: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    fontFamily: theme.typography.fontBodyBold,
  },
  cardTitleAr: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
    fontFamily: theme.typography.fontBody,
  },
  cardWhen: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
    fontFamily: theme.typography.fontBody,
  },
  expandIcon: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  cardBody: {
    padding: theme.spacing.lg,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  arabic: {
    fontSize: 22,
    color: theme.colors.text,
    textAlign: 'right',
    lineHeight: 36,
    marginBottom: theme.spacing.md,
    fontFamily: theme.typography.fontBody,
  },
  transliteration: {
    fontSize: 14,
    color: theme.colors.accent,
    fontStyle: 'italic',
    marginBottom: theme.spacing.sm,
    fontFamily: theme.typography.fontBody,
  },
  translation: {
    fontSize: 14,
    color: theme.colors.textMuted,
    lineHeight: 22,
    fontFamily: theme.typography.fontBody,
  },
});
