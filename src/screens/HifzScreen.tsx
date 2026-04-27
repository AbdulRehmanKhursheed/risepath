import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
  ScrollView, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../constants/theme';
import { SURAH_LIST } from '../constants/surahList';
import { AdBanner } from '../components/AdBanner';
import { AD_UNITS } from '../services/ads';

const HIFZ_KEY = 'hifz_progress';

type HifzStatus = 'none' | 'learning' | 'memorized';

// Starting juz for each surah (1-indexed, surah 1 = index 0)
const SURAH_JUZ: number[] = [
  1,1,3,4,6,7,8,10,10,11,
  11,12,13,13,14,14,15,15,16,16,
  17,17,18,18,18,19,19,20,20,21,
  21,21,21,22,22,22,23,23,23,24,
  24,25,25,25,25,26,26,26,26,26,
  27,27,27,27,27,27,27,28,28,28,
  28,28,28,28,28,28,28,28,28,28,
  29,29,29,29,29,29,29,29,29,29,
  30,30,30,30,30,30,30,30,30,30,
  30,30,30,30,30,30,30,30,30,30,
  30,30,30,30,30,30,30,30,30,30,
  30,30,30,30,
];

const STATUS_ORDER: HifzStatus[] = ['none', 'learning', 'memorized'];
const STATUS_META: Record<HifzStatus, { label: string; color: string; bg: string; icon: string }> = {
  none:      { label: 'Not started', color: theme.colors.textMuted,  bg: theme.colors.backgroundSoft, icon: '○' },
  learning:  { label: 'Memorizing',  color: '#C87800',               bg: '#FFF4E0',                   icon: '◑' },
  memorized: { label: 'Memorized',   color: theme.colors.success,    bg: theme.colors.successMuted,   icon: '●' },
};

const JUZ_LABELS = Array.from({ length: 30 }, (_, i) => i + 1);

export function HifzScreen() {
  const insets = useSafeAreaInsets();
  const [progress, setProgress] = useState<Record<number, HifzStatus>>({});
  const [activeJuz, setActiveJuz] = useState<number | null>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    AsyncStorage.getItem(HIFZ_KEY).then((raw) => {
      if (!raw) return;
      try {
        setProgress(JSON.parse(raw));
      } catch {}
    });
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const cycleStatus = useCallback(async (surahNum: number) => {
    setProgress((prev) => {
      const current = prev[surahNum] ?? 'none';
      const nextIndex = (STATUS_ORDER.indexOf(current) + 1) % STATUS_ORDER.length;
      const next = { ...prev, [surahNum]: STATUS_ORDER[nextIndex] };
      AsyncStorage.setItem(HIFZ_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const memorized = SURAH_LIST.filter((s) => progress[s.number] === 'memorized').length;
  const learning = SURAH_LIST.filter((s) => progress[s.number] === 'learning').length;
  const progressPct = Math.round((memorized / 114) * 100);

  const displayedSurahs = activeJuz
    ? SURAH_LIST.filter((s) => SURAH_JUZ[s.number - 1] === activeJuz)
    : SURAH_LIST;

  const renderSurah = ({ item }: { item: typeof SURAH_LIST[0] }) => {
    const status = progress[item.number] ?? 'none';
    const meta = STATUS_META[status];
    return (
      <View style={styles.surahRow}>
        <View style={styles.surahNumBadge}>
          <Text style={styles.surahNum}>{item.number}</Text>
        </View>
        <View style={styles.surahInfo}>
          <Text style={styles.surahArabic}>{item.nameArabic}</Text>
          <Text style={styles.surahEnglish}>{item.nameEnglish} · {item.ayahs} ayahs</Text>
        </View>
        <TouchableOpacity
          style={[styles.statusBtn, { backgroundColor: meta.bg, borderColor: meta.color + '60' }]}
          onPress={() => cycleStatus(item.number)}
          activeOpacity={0.8}
        >
          <Text style={[styles.statusIcon, { color: meta.color }]}>{meta.icon}</Text>
          <Text style={[styles.statusLabel, { color: meta.color }]}>{meta.label}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hifz Tracker</Text>
        <Text style={styles.headerSub}>Track your Quran memorization</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{memorized}</Text>
          <Text style={styles.statLabel}>Memorized</Text>
          <View style={[styles.statDot, { backgroundColor: theme.colors.success }]} />
        </View>
        <View style={styles.progressRingWrap}>
          <View style={styles.progressRing}>
            <View style={[styles.progressRingFill, {
              borderColor: theme.colors.accent,
              borderTopColor: progressPct > 25 ? theme.colors.accent : theme.colors.backgroundSoft,
              borderRightColor: progressPct > 50 ? theme.colors.accent : theme.colors.backgroundSoft,
              borderBottomColor: progressPct > 75 ? theme.colors.accent : theme.colors.backgroundSoft,
            }]} />
            <View style={styles.progressRingInner}>
              <Text style={styles.progressRingPct}>{progressPct}%</Text>
              <Text style={styles.progressRingLabel}>complete</Text>
            </View>
          </View>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: '#C87800' }]}>{learning}</Text>
          <Text style={styles.statLabel}>Memorizing</Text>
          <View style={[styles.statDot, { backgroundColor: '#C87800' }]} />
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legendRow}>
        {STATUS_ORDER.map((s) => (
          <View key={s} style={styles.legendItem}>
            <Text style={[styles.legendIcon, { color: STATUS_META[s].color }]}>{STATUS_META[s].icon}</Text>
            <Text style={styles.legendLabel}>{STATUS_META[s].label}</Text>
            <Text style={styles.legendHint}>(tap to cycle)</Text>
          </View>
        ))}
      </View>

      <AdBanner unitId={AD_UNITS.bannerHifz} />

      {/* Juz filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.juzRow}>
        <TouchableOpacity
          style={[styles.juzChip, activeJuz === null && styles.juzChipActive]}
          onPress={() => setActiveJuz(null)}
        >
          <Text style={[styles.juzChipText, activeJuz === null && styles.juzChipTextActive]}>All</Text>
        </TouchableOpacity>
        {JUZ_LABELS.map((juz) => {
          const juzMem = SURAH_LIST
            .filter((s) => SURAH_JUZ[s.number - 1] === juz)
            .every((s) => progress[s.number] === 'memorized');
          return (
            <TouchableOpacity
              key={juz}
              style={[styles.juzChip, activeJuz === juz && styles.juzChipActive, juzMem && styles.juzChipDone]}
              onPress={() => setActiveJuz(activeJuz === juz ? null : juz)}
            >
              <Text style={[styles.juzChipText, activeJuz === juz && styles.juzChipTextActive]}>
                {juzMem ? '✓ ' : ''}Juz {juz}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Surah list */}
      <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
        <FlatList
          data={displayedSurahs}
          keyExtractor={(item) => String(item.number)}
          renderItem={renderSurah}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 16 }]}
          showsVerticalScrollIndicator={false}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },

  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  headerTitle: { fontFamily: theme.typography.fontHeadingBold, fontSize: 26, color: theme.colors.text },
  headerSub: { fontFamily: theme.typography.fontBody, fontSize: 13, color: theme.colors.textMuted, marginTop: 2 },

  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 20, marginBottom: 8 },
  statCard: { alignItems: 'center', gap: 4 },
  statNum: { fontFamily: theme.typography.fontHeadingBold, fontSize: 32, color: theme.colors.success },
  statLabel: { fontFamily: theme.typography.fontBodyMedium, fontSize: 12, color: theme.colors.textMuted },
  statDot: { width: 8, height: 8, borderRadius: 4 },

  progressRingWrap: { alignItems: 'center', justifyContent: 'center' },
  progressRing: { width: 90, height: 90, alignItems: 'center', justifyContent: 'center' },
  progressRingFill: {
    position: 'absolute', width: 84, height: 84, borderRadius: 42,
    borderWidth: 7, borderColor: theme.colors.accent,
  },
  progressRingInner: { alignItems: 'center' },
  progressRingPct: { fontFamily: theme.typography.fontHeadingBold, fontSize: 20, color: theme.colors.text },
  progressRingLabel: { fontFamily: theme.typography.fontBody, fontSize: 10, color: theme.colors.textMuted },

  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 8, paddingHorizontal: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendIcon: { fontSize: 13 },
  legendLabel: { fontFamily: theme.typography.fontBodyMedium, fontSize: 11, color: theme.colors.textSecondary },
  legendHint: { fontFamily: theme.typography.fontBody, fontSize: 10, color: theme.colors.textMuted },

  juzRow: { paddingHorizontal: 12, paddingBottom: 8, gap: 6 },
  juzChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border,
  },
  juzChipActive: { backgroundColor: theme.colors.accentMuted, borderColor: theme.colors.accent },
  juzChipDone: { borderColor: theme.colors.success + '80', backgroundColor: theme.colors.successMuted },
  juzChipText: { fontFamily: theme.typography.fontBodyMedium, fontSize: 12, color: theme.colors.textMuted },
  juzChipTextActive: { color: theme.colors.accent },

  list: { paddingHorizontal: 16, paddingTop: 4 },
  surahRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md,
    padding: 10, marginBottom: 6, borderWidth: 1, borderColor: theme.colors.borderSoft,
  },
  surahNumBadge: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: theme.colors.accentMuted, alignItems: 'center', justifyContent: 'center',
  },
  surahNum: { fontFamily: theme.typography.fontBodyBold, fontSize: 12, color: theme.colors.accent },
  surahInfo: { flex: 1 },
  surahArabic: { fontFamily: 'System', fontSize: 15, color: theme.colors.textSecondary },
  surahEnglish: { fontFamily: theme.typography.fontBody, fontSize: 11, color: theme.colors.textMuted },
  statusBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: theme.borderRadius.full,
    borderWidth: 1, minWidth: 100, justifyContent: 'center',
  },
  statusIcon: { fontSize: 13 },
  statusLabel: { fontFamily: theme.typography.fontBodyMedium, fontSize: 11 },
});
