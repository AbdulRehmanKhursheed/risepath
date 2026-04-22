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
import { useLanguage } from '../contexts/LanguageContext';
import { useSimpleMode } from '../contexts/SimpleModeContext';
import { theme } from '../constants/theme';
import {
  EID_FITR_SECTIONS,
  EID_ADHA_SECTIONS,
  UPCOMING_EID_DATES,
  EidSection,
  EidMasala,
} from '../constants/eidGuide';
import { AdBanner } from '../components/AdBanner';
import { AD_UNITS } from '../services/ads';

type EidTab = 'fitr' | 'adha';

function getNextEid() {
  const now = new Date();
  return UPCOMING_EID_DATES.find((e) => e.date > now) ?? null;
}

function daysUntil(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function MasalaCard({ masala, isUrdu, fs }: { masala: EidMasala; isUrdu: boolean; fs: (n: number) => number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      style={[styles.masalaCard, masala.important && styles.masalaCardImportant]}
      onPress={() => setExpanded((v) => !v)}
      activeOpacity={0.85}
    >
      <View style={styles.masalaHeader}>
        <View style={{ flex: 1 }}>
          {masala.important && (
            <Text style={[styles.importantBadge, { fontSize: fs(10) }]}>IMPORTANT</Text>
          )}
          <Text style={[styles.masalaTitle, { fontSize: fs(14) }]}>
            {isUrdu ? masala.titleUr : masala.title}
          </Text>
          {masala.source && !expanded && (
            <Text style={[styles.sourceHint, { fontSize: fs(11) }]}>{masala.source}</Text>
          )}
        </View>
        <Text style={[styles.chevron, { fontSize: fs(16) }]}>{expanded ? '▲' : '▼'}</Text>
      </View>

      {expanded && (
        <View style={styles.masalaBody}>
          <Text style={[styles.masalaDesc, { fontSize: fs(13) }]}>
            {isUrdu ? masala.descriptionUr : masala.description}
          </Text>

          {masala.dua && (
            <View style={styles.duaBox}>
              <Text style={styles.duaArabic}>{masala.dua.arabic}</Text>
              <Text style={[styles.duaTranslit, { fontSize: fs(12) }]}>{masala.dua.transliteration}</Text>
              <Text style={[styles.duaTrans, { fontSize: fs(12) }]}>
                {isUrdu ? masala.dua.translationUr : masala.dua.translation}
              </Text>
            </View>
          )}

          {masala.tips && masala.tips.length > 0 && (
            <View style={styles.tipsBox}>
              {(isUrdu ? masala.tipsUr ?? masala.tips : masala.tips).map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <Text style={[styles.tipBullet, { fontSize: fs(12) }]}>•</Text>
                  <Text style={[styles.tipText, { fontSize: fs(12) }]}>{tip}</Text>
                </View>
              ))}
            </View>
          )}

          {masala.madhabNote && (
            <View style={styles.madhabBox}>
              <Text style={[styles.madhabLabel, { fontSize: fs(10) }]}>MADHAB NOTE</Text>
              <Text style={[styles.madhabText, { fontSize: fs(12) }]}>
                {isUrdu ? masala.madhabNoteUr ?? masala.madhabNote : masala.madhabNote}
              </Text>
            </View>
          )}

          {masala.womenNote && (
            <View style={styles.womenBox}>
              <Text style={[styles.womenLabel, { fontSize: fs(10) }]}>♀ WOMEN</Text>
              <Text style={[styles.womenText, { fontSize: fs(12) }]}>
                {isUrdu ? masala.womenNoteUr ?? masala.womenNote : masala.womenNote}
              </Text>
            </View>
          )}

          {masala.source && (
            <Text style={[styles.sourceText, { fontSize: fs(11) }]}>Source: {masala.source}</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

function SectionBlock({ section, isUrdu, fs }: { section: EidSection; isUrdu: boolean; fs: (n: number) => number }) {
  const [open, setOpen] = useState(true);

  return (
    <View style={styles.sectionBlock}>
      <TouchableOpacity style={styles.sectionHeader} onPress={() => setOpen((v) => !v)} activeOpacity={0.85}>
        <Text style={[styles.sectionIcon, { fontSize: fs(18) }]}>{section.icon}</Text>
        <Text style={[styles.sectionTitle, { fontSize: fs(15) }]}>
          {isUrdu ? section.titleUr : section.title}
        </Text>
        <Text style={[styles.sectionCount, { fontSize: fs(11) }]}>{section.masail.length}</Text>
        <Text style={[styles.chevron, { fontSize: fs(14) }]}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {open &&
        section.masail.map((masala) => (
          <MasalaCard key={masala.id} masala={masala} isUrdu={isUrdu} fs={fs} />
        ))}
    </View>
  );
}

export function EidScreen() {
  const [activeTab, setActiveTab] = useState<EidTab>('fitr');
  const { language } = useLanguage();
  const { fs } = useSimpleMode();
  const isUrdu = language === 'ur';

  const sections = activeTab === 'fitr' ? EID_FITR_SECTIONS : EID_ADHA_SECTIONS;
  const nextEid = getNextEid();
  const days = nextEid ? daysUntil(nextEid.date) : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['rgba(200,120,10,0.14)', 'rgba(26,122,60,0.10)', 'transparent']}
        style={styles.hero}
      >
        <Text style={[styles.heroEmoji, { fontSize: fs(40) }]}>🌙</Text>
        <Text style={[styles.heroTitle, { fontSize: fs(24) }]}>
          {isUrdu ? 'عید گائیڈ' : 'Eid Guide'}
        </Text>
        <Text style={[styles.heroSub, { fontSize: fs(13) }]}>
          {isUrdu ? 'مسائل، احکام اور دعائیں' : 'Masail, Rulings & Duas'}
        </Text>
      </LinearGradient>

      {nextEid && days !== null && (
        <View style={styles.countdownCard}>
          <View>
            <Text style={[styles.countdownLabel, { fontSize: fs(11) }]}>
              {isUrdu ? 'اگلی عید' : 'NEXT EID'}
            </Text>
            <Text style={[styles.countdownName, { fontSize: fs(15) }]}>
              {isUrdu ? nextEid.nameUr : nextEid.name}
            </Text>
            <Text style={[styles.countdownDisclaimer, { fontSize: fs(10) }]}>
              {isUrdu
                ? '* چاند دیکھنے پر منحصر'
                : '* Approx. — subject to moon sighting'}
            </Text>
          </View>
          <View style={styles.daysBox}>
            <Text style={[styles.daysNumber, { fontSize: fs(28) }]}>{days}</Text>
            <Text style={[styles.daysLabel, { fontSize: fs(10) }]}>
              {isUrdu ? 'دن باقی' : 'DAYS'}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'fitr' && styles.tabActive]}
          onPress={() => setActiveTab('fitr')}
          activeOpacity={0.85}
        >
          <Text style={[styles.tabText, activeTab === 'fitr' && styles.tabTextActive, { fontSize: fs(13) }]}>
            {isUrdu ? 'عیدالفطر' : 'Eid ul-Fitr'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'adha' && styles.tabActive]}
          onPress={() => setActiveTab('adha')}
          activeOpacity={0.85}
        >
          <Text style={[styles.tabText, activeTab === 'adha' && styles.tabTextActive, { fontSize: fs(13) }]}>
            {isUrdu ? 'عیدالاضحی' : 'Eid ul-Adha'}
          </Text>
        </TouchableOpacity>
      </View>

      {sections.map((section) => (
        <SectionBlock key={section.id} section={section} isUrdu={isUrdu} fs={fs} />
      ))}

      <View style={styles.disclaimer}>
        <Text style={[styles.disclaimerText, { fontSize: fs(11) }]}>
          {isUrdu
            ? 'یہ گائیڈ تعلیمی مقاصد کے لیے ہے۔ اپنے مسلک کے عالم سے مشورہ کریں۔'
            : 'This guide is for educational purposes. Consult a qualified scholar for your specific madhab.'}
        </Text>
      </View>
      <AdBanner unitId={AD_UNITS.bannerGuides} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingBottom: 40 },
  hero: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: theme.spacing.xl,
  },
  heroEmoji: { marginBottom: 8 },
  heroTitle: {
    fontFamily: theme.typography.fontHeadingBold,
    color: theme.colors.text,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  heroSub: {
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  countdownCard: {
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      ios: { shadowColor: theme.colors.accent, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  countdownLabel: {
    fontFamily: theme.typography.fontBodyBold,
    color: theme.colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  countdownName: {
    fontFamily: theme.typography.fontHeadingBold,
    color: theme.colors.text,
    fontWeight: '700',
  },
  countdownDisclaimer: {
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
  },
  daysBox: {
    alignItems: 'center',
    backgroundColor: theme.colors.accentMuted,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 64,
  },
  daysNumber: {
    fontFamily: theme.typography.fontHeadingBold,
    color: theme.colors.accent,
    fontWeight: '700',
  },
  daysLabel: {
    fontFamily: theme.typography.fontBodyBold,
    color: theme.colors.accent,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
  },
  tabActive: {
    backgroundColor: theme.colors.accent,
    ...Platform.select({
      ios: { shadowColor: theme.colors.accent, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  tabText: {
    fontFamily: theme.typography.fontBodyMedium,
    color: theme.colors.textMuted,
  },
  tabTextActive: { color: '#fff', fontFamily: theme.typography.fontBodyBold },
  sectionBlock: {
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  sectionIcon: { color: theme.colors.accent },
  sectionTitle: {
    flex: 1,
    fontFamily: theme.typography.fontBodyBold,
    color: theme.colors.text,
    fontWeight: '600',
  },
  sectionCount: {
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
    backgroundColor: theme.colors.background,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  chevron: { color: theme.colors.textMuted },
  masalaCard: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  masalaCardImportant: {
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.accent,
  },
  masalaHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm },
  importantBadge: {
    fontFamily: theme.typography.fontBodyBold,
    color: theme.colors.accent,
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  masalaTitle: {
    fontFamily: theme.typography.fontBodyMedium,
    color: theme.colors.text,
    flex: 1,
  },
  sourceHint: {
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
    marginTop: 3,
    fontStyle: 'italic',
  },
  masalaBody: { marginTop: theme.spacing.md, gap: theme.spacing.md },
  masalaDesc: {
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textSecondary,
    lineHeight: 21,
  },
  duaBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 8,
  },
  duaArabic: {
    fontFamily: 'System',
    fontSize: 20,
    color: theme.colors.text,
    textAlign: 'right',
    lineHeight: 36,
    writingDirection: 'rtl',
  },
  duaTranslit: {
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },
  duaTrans: {
    fontFamily: theme.typography.fontBodyMedium,
    color: theme.colors.textSecondary,
  },
  tipsBox: { gap: 6 },
  tipRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  tipBullet: { color: theme.colors.accent, lineHeight: 18 },
  tipText: { fontFamily: theme.typography.fontBody, color: theme.colors.textSecondary, flex: 1, lineHeight: 18 },
  madhabBox: {
    backgroundColor: 'rgba(200,120,10,0.08)',
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(200,120,10,0.2)',
  },
  madhabLabel: {
    fontFamily: theme.typography.fontBodyBold,
    color: theme.colors.accent,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  madhabText: { fontFamily: theme.typography.fontBody, color: theme.colors.textSecondary },
  womenBox: {
    backgroundColor: 'rgba(26,122,60,0.07)',
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(26,122,60,0.2)',
  },
  womenLabel: {
    fontFamily: theme.typography.fontBodyBold,
    color: theme.colors.success ?? '#1A7A3C',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  womenText: { fontFamily: theme.typography.fontBody, color: theme.colors.textSecondary },
  sourceText: {
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },
  disclaimer: {
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.lg,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  disclaimerText: {
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
