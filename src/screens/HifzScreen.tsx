import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
  ScrollView, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle } from 'react-native-svg';
import { theme } from '../constants/theme';
import { SURAH_LIST } from '../constants/surahList';
import { AdBanner } from '../components/AdBanner';
import { AD_UNITS } from '../services/ads';
import { ArabicText } from '../components/ui/ArabicText';
import { useLanguage } from '../contexts/LanguageContext';
import { captureError } from '../services/sentry';

const HIFZ_KEY = 'hifz_progress';

type HifzStatus = 'none' | 'learning' | 'memorized';

// Starting juz for each surah (1-indexed, surah 1 = index 0).
// Verified against quran.com /api/v4/juzs verse ranges (2026-06-10): each
// entry is the juz containing the surah's first ayah. No surah starts in
// juz 2 or 5 (they begin mid-surah at 2:142 and 4:24), so those juz get
// no filter chip below.
const SURAH_JUZ: number[] = [
  1,1,3,4,6,7,8,9,10,11,
  11,12,13,13,14,14,15,15,16,16,
  17,17,18,18,18,19,19,20,20,21,
  21,21,21,22,22,22,23,23,23,24,
  24,25,25,25,25,26,26,26,26,26,
  26,27,27,27,27,27,27,28,28,28,
  28,28,28,28,28,28,29,29,29,29,
  29,29,29,29,29,29,29,30,30,30,
  30,30,30,30,30,30,30,30,30,30,
  30,30,30,30,30,30,30,30,30,30,
  30,30,30,30,30,30,30,30,30,30,
  30,30,30,30,
];

const STATUS_ORDER: HifzStatus[] = ['none', 'learning', 'memorized'];
const STATUS_META: Record<HifzStatus, { color: string; bg: string; icon: string }> = {
  none:      { color: theme.colors.textMuted,  bg: theme.colors.backgroundSoft, icon: '○' },
  learning:  { color: '#C87800',               bg: '#FFF4E0',                   icon: '◑' },
  memorized: { color: theme.colors.success,    bg: theme.colors.successMuted,   icon: '●' },
};

type Locale = 'en' | 'ur' | 'ar';

// Same inline-label pattern as TasbihScreen — this screen previously had no
// language context at all and rendered hardcoded English for ur/ar users.
const LABELS: Record<Locale, {
  title: string; sub: string;
  notStarted: string; memorizing: string; memorized: string;
  complete: string; tapToCycle: string; all: string; juz: string; ayahs: string;
}> = {
  en: {
    title: 'Hifz Tracker', sub: 'Track your Quran memorization',
    notStarted: 'Not started', memorizing: 'Memorizing', memorized: 'Memorized',
    complete: 'complete', tapToCycle: '(tap to cycle)', all: 'All', juz: 'Juz', ayahs: 'ayahs',
  },
  ur: {
    title: 'حفظِ قرآن', sub: 'اپنے حفظ کی پیشرفت دیکھیں',
    notStarted: 'شروع نہیں کیا', memorizing: 'حفظ جاری', memorized: 'حفظ مکمل',
    complete: 'مکمل', tapToCycle: '(بدلنے کے لیے ٹیپ کریں)', all: 'تمام', juz: 'پارہ', ayahs: 'آیات',
  },
  ar: {
    title: 'متابعة الحفظ', sub: 'تابع حفظك للقرآن الكريم',
    notStarted: 'لم يبدأ', memorizing: 'قيد الحفظ', memorized: 'محفوظة',
    complete: 'مكتمل', tapToCycle: '(اضغط للتبديل)', all: 'الكل', juz: 'جزء', ayahs: 'آيات',
  },
};

const JUZ_LABELS = Array.from({ length: 30 }, (_, i) => i + 1);

// Precomputed juz → surah-numbers groups. Computing these inline ran 30 ×
// 114 filter scans on every render (same class of lag the stats memo below
// was added for). Juz with no starting surah (2 and 5) are dropped so their
// chips can't render a vacuous "✓ memorized" over an empty list.
const JUZ_GROUPS: { juz: number; surahs: number[] }[] = JUZ_LABELS
  .map((juz) => ({
    juz,
    surahs: SURAH_LIST.filter((s) => SURAH_JUZ[s.number - 1] === juz).map((s) => s.number),
  }))
  .filter((g) => g.surahs.length > 0);

// True fractional progress arc (react-native-svg, same technique as
// StreakRing). The old border-quadrant fake showed a permanently-filled
// left quadrant — ~25% at zero progress — and only had 25% granularity.
const RING_SIZE = 90;
const RING_STROKE = 7;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export function HifzScreen() {
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const locale: Locale = (['en', 'ur', 'ar'].includes(language as string) ? language : 'en') as Locale;
  const L = LABELS[locale];
  const statusLabel: Record<HifzStatus, string> = {
    none: L.notStarted,
    learning: L.memorizing,
    memorized: L.memorized,
  };
  const [progress, setProgress] = useState<Record<number, HifzStatus>>({});
  const [activeJuz, setActiveJuz] = useState<number | null>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const progressRef = useRef<Record<number, HifzStatus>>({});
  useEffect(() => { progressRef.current = progress; }, [progress]);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(HIFZ_KEY).then((raw) => {
      if (!mounted || !raw) return;
      try {
        const parsed = JSON.parse(raw);
        progressRef.current = parsed;
        setProgress(parsed);
      } catch {}
    });
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    return () => { mounted = false; };
  }, []);

  const cycleStatus = useCallback(async (surahNum: number) => {
    const current = progressRef.current[surahNum] ?? 'none';
    const nextIndex = (STATUS_ORDER.indexOf(current) + 1) % STATUS_ORDER.length;
    const next = { ...progressRef.current, [surahNum]: STATUS_ORDER[nextIndex] };
    progressRef.current = next;
    setProgress(next);
    // Surface (don't swallow) persistence failures — a failed write here
    // means the surah silently reverts on next launch.
    AsyncStorage.setItem(HIFZ_KEY, JSON.stringify(next)).catch((err) =>
      captureError(err, { scope: 'hifz:save' })
    );
  }, []);

  // Three 114-item filters fired on every render before memo — cycling a
  // status or tapping a juz chip caused noticeable lag.
  const { memorized, learning, progressPct, progressFrac } = useMemo(() => {
    const m = SURAH_LIST.filter((s) => progress[s.number] === 'memorized').length;
    const l = SURAH_LIST.filter((s) => progress[s.number] === 'learning').length;
    return {
      memorized: m,
      learning: l,
      progressPct: Math.round((m / 114) * 100),
      progressFrac: m / 114,
    };
  }, [progress]);

  // Per-juz "all memorized" flags, derived once per progress change instead
  // of 30 × 114 scans inside the chip-row JSX on every render.
  const juzDone = useMemo(() => {
    const done = new Set<number>();
    for (const g of JUZ_GROUPS) {
      if (g.surahs.every((n) => progress[n] === 'memorized')) done.add(g.juz);
    }
    return done;
  }, [progress]);

  const displayedSurahs = useMemo(
    () =>
      activeJuz
        ? SURAH_LIST.filter((s) => SURAH_JUZ[s.number - 1] === activeJuz)
        : SURAH_LIST,
    [activeJuz]
  );

  const renderSurah = ({ item }: { item: typeof SURAH_LIST[0] }) => {
    const status = progress[item.number] ?? 'none';
    const meta = STATUS_META[status];
    return (
      <View style={styles.surahRow}>
        <View style={styles.surahNumBadge}>
          <Text style={styles.surahNum}>{item.number}</Text>
        </View>
        <View style={styles.surahInfo}>
          <ArabicText style={styles.surahArabic}>{item.nameArabic}</ArabicText>
          <Text style={styles.surahEnglish}>{item.nameEnglish} · {item.ayahs} {L.ayahs}</Text>
        </View>
        <TouchableOpacity
          style={[styles.statusBtn, { backgroundColor: meta.bg, borderColor: meta.color + '60' }]}
          onPress={() => cycleStatus(item.number)}
          activeOpacity={0.8}
        >
          <Text style={[styles.statusIcon, { color: meta.color }]}>{meta.icon}</Text>
          <Text style={[styles.statusLabel, { color: meta.color }]}>{statusLabel[status]}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{L.title}</Text>
        <Text style={styles.headerSub}>{L.sub}</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{memorized}</Text>
          <Text style={styles.statLabel}>{L.memorized}</Text>
          <View style={[styles.statDot, { backgroundColor: theme.colors.success }]} />
        </View>
        <View style={styles.progressRingWrap}>
          <View style={styles.progressRing}>
            <Svg width={RING_SIZE} height={RING_SIZE} style={StyleSheet.absoluteFill}>
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke={theme.colors.backgroundSoft}
                strokeWidth={RING_STROKE}
                fill="none"
              />
              {progressFrac > 0 && (
                <Circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_RADIUS}
                  stroke={theme.colors.accent}
                  strokeWidth={RING_STROKE}
                  fill="none"
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={RING_CIRCUMFERENCE * (1 - progressFrac)}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
                />
              )}
            </Svg>
            <View style={styles.progressRingInner}>
              <Text style={styles.progressRingPct}>{progressPct}%</Text>
              <Text style={styles.progressRingLabel}>{L.complete}</Text>
            </View>
          </View>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: '#C87800' }]}>{learning}</Text>
          <Text style={styles.statLabel}>{L.memorizing}</Text>
          <View style={[styles.statDot, { backgroundColor: '#C87800' }]} />
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legendRow}>
        {STATUS_ORDER.map((s) => (
          <View key={s} style={styles.legendItem}>
            <Text style={[styles.legendIcon, { color: STATUS_META[s].color }]}>{STATUS_META[s].icon}</Text>
            <Text style={styles.legendLabel}>{statusLabel[s]}</Text>
            <Text style={styles.legendHint}>{L.tapToCycle}</Text>
          </View>
        ))}
      </View>

      <AdBanner unitId={AD_UNITS.bannerHifz} />

      {/* Juz filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.juzRow} style={styles.juzScroll}>
        <TouchableOpacity
          style={[styles.juzChip, activeJuz === null && styles.juzChipActive]}
          onPress={() => setActiveJuz(null)}
        >
          <Text style={[styles.juzChipText, activeJuz === null && styles.juzChipTextActive]}>{L.all}</Text>
        </TouchableOpacity>
        {JUZ_GROUPS.map(({ juz }) => {
          const juzMem = juzDone.has(juz);
          return (
            <TouchableOpacity
              key={juz}
              style={[styles.juzChip, activeJuz === juz && styles.juzChipActive, juzMem && styles.juzChipDone]}
              onPress={() => setActiveJuz(activeJuz === juz ? null : juz)}
            >
              <Text style={[styles.juzChipText, activeJuz === juz && styles.juzChipTextActive]}>
                {juzMem ? '✓ ' : ''}{L.juz} {juz}
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
  progressRing: { width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' },
  progressRingInner: { alignItems: 'center' },
  progressRingPct: { fontFamily: theme.typography.fontHeadingBold, fontSize: 20, color: theme.colors.text },
  progressRingLabel: { fontFamily: theme.typography.fontBody, fontSize: 10, color: theme.colors.textMuted },

  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 8, paddingHorizontal: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendIcon: { fontSize: 13 },
  legendLabel: { fontFamily: theme.typography.fontBodyMedium, fontSize: 11, color: theme.colors.textSecondary },
  legendHint: { fontFamily: theme.typography.fontBody, fontSize: 10, color: theme.colors.textMuted },

  juzScroll: { flexGrow: 0, maxHeight: 38, marginBottom: 4 },
  juzRow: { paddingHorizontal: 16, gap: 6, alignItems: 'center' },
  juzChip: {
    height: 28,
    paddingHorizontal: 10,
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border,
  },
  juzChipActive: { backgroundColor: theme.colors.accentMuted, borderColor: theme.colors.accent },
  juzChipDone: { borderColor: theme.colors.success + '80', backgroundColor: theme.colors.successMuted },
  juzChipText: { fontFamily: theme.typography.fontBodyMedium, fontSize: 11, lineHeight: 14, color: theme.colors.textMuted, includeFontPadding: false },
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
  surahArabic: { fontFamily: theme.typography.fontQuranUthmani, fontSize: 15, color: theme.colors.textSecondary },
  surahEnglish: { fontFamily: theme.typography.fontBody, fontSize: 11, color: theme.colors.textMuted },
  statusBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: theme.borderRadius.full,
    borderWidth: 1, minWidth: 100, justifyContent: 'center',
  },
  statusIcon: { fontSize: 13 },
  statusLabel: { fontFamily: theme.typography.fontBodyMedium, fontSize: 11 },
});
