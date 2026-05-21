import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Modal, ScrollView, Animated, AppState, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';
import { ASMAUL_HUSNA, type Name99 } from '../constants/asmaulHusna';
import { AdBanner } from '../components/AdBanner';
import { AD_UNITS } from '../services/ads';
import { useAsmaulHusnaAudio } from '../hooks/useAsmaulHusnaAudio';

const KNOWN_KEY = 'asmaul_husna_known';

export function AsmaulHusnaScreen() {
  const insets = useSafeAreaInsets();
  const [known, setKnown] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<Name99 | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const audio = useAsmaulHusnaAudio();
  const listRef = useRef<FlatList<Name99>>(null);

  useEffect(() => {
    AsyncStorage.getItem(KNOWN_KEY).then((raw) => {
      if (!raw) return;
      try {
        setKnown(new Set(JSON.parse(raw)));
      } catch {}
    });
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  // Reset modal on navigation away so it doesn't re-appear on return.
  // Guarded against app-background blur so backgrounding the app doesn't
  // close a name the user was reading. Also stops audio so a name doesn't
  // keep reciting while the user is on a different screen.
  useFocusEffect(
    useCallback(() => {
      return () => {
        if (AppState.currentState === 'active') {
          setModalVisible(false);
          setSelected(null);
          audio.stop();
        }
      };
    }, [audio])
  );

  // During play-all, auto-scroll the grid so the currently-playing name
  // stays visible. viewPosition 0.3 keeps it in the upper third where
  // the user's eye naturally lands.
  useEffect(() => {
    if (!audio.isPlayAll || audio.currentNumber == null) return;
    listRef.current?.scrollToIndex({
      index: audio.currentNumber - 1,
      viewPosition: 0.3,
      animated: true,
    });
  }, [audio.isPlayAll, audio.currentNumber]);

  const toggleKnown = async (num: number) => {
    setKnown((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num); else next.add(num);
      AsyncStorage.setItem(KNOWN_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  const openName = (name: Name99) => {
    setSelected(name);
    setModalVisible(true);
  };

  const progressPct = Math.round((known.size / 99) * 100);

  const renderItem = ({ item, index }: { item: Name99; index: number }) => {
    const isKnown = known.has(item.number);
    const isPlaying = audio.isPlayAll && audio.currentNumber === item.number;
    return (
      <TouchableOpacity
        style={[
          styles.nameCard,
          isKnown && styles.nameCardKnown,
          isPlaying && styles.nameCardPlaying,
        ]}
        onPress={() => openName(item)}
        activeOpacity={0.82}
      >
        <View style={[styles.numBadge, isKnown && styles.numBadgeKnown, isPlaying && styles.numBadgePlaying]}>
          <Text style={[styles.numText, isKnown && styles.numTextKnown, isPlaying && styles.numTextPlaying]}>
            {item.number}
          </Text>
        </View>
        <Text style={styles.nameArabic}>{item.arabic}</Text>
        <Text style={styles.nameTranslit}>{item.transliteration}</Text>
        <Text style={styles.nameMeaning} numberOfLines={1}>{item.meaning}</Text>
        {isPlaying && <Text style={styles.playingBadge}>▶ Playing</Text>}
      </TouchableOpacity>
    );
  };

  const onPressListen = useCallback(
    (name: Name99) => {
      const sameAndPlaying =
        audio.currentNumber === name.number &&
        (audio.state === 'playing' || audio.state === 'loading');
      if (sameAndPlaying) {
        audio.pause();
      } else {
        audio.play(name.number);
      }
    },
    [audio],
  );

  const onPressPlayAll = useCallback(() => {
    if (audio.isPlayAll && (audio.state === 'playing' || audio.state === 'loading')) {
      audio.stop();
    } else {
      audio.playAll(1);
    }
  }, [audio]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient
        colors={[theme.colors.accentMuted, theme.colors.background]}
        style={styles.headerGradient}
      >
        <Text style={styles.headerTitle}>99 Names of Allah</Text>
        <Text style={styles.headerArabic}>أسماء الله الحسنى</Text>

        {/* Progress + small Play-all pill on the right.
            The pill stays minimal because the now-playing card in the grid
            (highlighted + auto-scrolled into view) already communicates
            which name is being recited. */}
        <View style={styles.progressRow}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPct}%` as any }]} />
          </View>
          <Text style={styles.progressText}>{known.size}/99 known</Text>
          <TouchableOpacity
            style={[styles.playAllPill, audio.isPlayAll && styles.playAllPillActive]}
            onPress={onPressPlayAll}
            activeOpacity={0.85}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {audio.isPlayAll && audio.state === 'loading' ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={[styles.playAllPillText, audio.isPlayAll && styles.playAllPillTextActive]} allowFontScaling={false}>
                {audio.isPlayAll ? '⏸ Stop' : '▶ Play all'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

      </LinearGradient>

      <AdBanner unitId={AD_UNITS.bannerNames} />

      {/* Grid */}
      <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
        <FlatList
          ref={listRef}
          data={ASMAUL_HUSNA}
          keyExtractor={(item) => String(item.number)}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 16 }]}
          showsVerticalScrollIndicator={false}
          // Scrolling to an offscreen index can fail silently; this fallback
          // makes scrollToIndex tolerant of unmeasured rows during play-all.
          onScrollToIndexFailed={(info) => {
            setTimeout(() => {
              listRef.current?.scrollToIndex({ index: info.index, viewPosition: 0.3, animated: true });
            }, 200);
          }}
        />
      </Animated.View>

      {/* Detail Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
            <View style={styles.modalHandle} />
            {selected && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalNumRow}>
                  <View style={styles.modalNumBadge}>
                    <Text style={styles.modalNumText}>{selected.number}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.knownBtn, known.has(selected.number) && styles.knownBtnActive]}
                    onPress={() => toggleKnown(selected.number)}
                  >
                    <Text style={[styles.knownBtnText, known.has(selected.number) && styles.knownBtnTextActive]}>
                      {known.has(selected.number) ? '✓ I know this' : 'Mark as known'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalArabic}>{selected.arabic}</Text>
                <Text style={styles.modalTranslit}>{selected.transliteration}</Text>
                {(() => {
                  const isMine = audio.currentNumber === selected.number && !audio.isPlayAll;
                  const isLoading = isMine && audio.state === 'loading';
                  const isPlaying = isMine && audio.state === 'playing';
                  return (
                    <TouchableOpacity
                      style={[styles.listenBtn, (isPlaying || isLoading) && styles.listenBtnActive]}
                      onPress={() => onPressListen(selected)}
                      activeOpacity={0.85}
                    >
                      {isLoading && (
                        <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                      )}
                      <Text style={styles.listenBtnText}>
                        {isLoading ? 'Loading…' : isPlaying ? '⏸  Pause' : '▶  Listen'}
                      </Text>
                    </TouchableOpacity>
                  );
                })()}
                {audio.state === 'error' && (
                  <Text style={styles.audioErrorText}>Audio unavailable — check your connection.</Text>
                )}
                <View style={styles.meaningCard}>
                  <Text style={styles.meaningLabel}>Meaning</Text>
                  <Text style={styles.meaningText}>{selected.meaning}</Text>
                </View>
                <Text style={styles.descText}>{selected.description}</Text>
                <View style={styles.dhikrCard}>
                  <Text style={styles.dhikrTitle}>Daily Dhikr</Text>
                  <Text style={styles.dhikrSub}>Recite this name 100 times after Fajr prayer</Text>
                  <Text style={styles.dhikrArabic}>{selected.arabic}</Text>
                </View>
              </ScrollView>
            )}
            <TouchableOpacity style={styles.modalClose} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },

  headerGradient: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  headerTitle: { fontFamily: theme.typography.fontHeadingBold, fontSize: 24, color: theme.colors.text },
  headerArabic: { fontFamily: theme.typography.fontQuranUthmani, fontSize: 18, color: theme.colors.accent, textAlign: 'right', marginTop: 2, marginBottom: 12 },

  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  progressBar: {
    flex: 1, height: 6, backgroundColor: theme.colors.border,
    borderRadius: 3, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: theme.colors.accent, borderRadius: 3 },
  progressText: { fontFamily: theme.typography.fontBodyMedium, fontSize: 12, color: theme.colors.textMuted },

  dailyCard: {
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md,
    borderWidth: 1.5, borderColor: theme.colors.accent,
    padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  dailyLeft: { flex: 1 },
  dailyLabel: { fontFamily: theme.typography.fontBodyMedium, fontSize: 11, color: theme.colors.accent, marginBottom: 4 },
  dailyArabic: { fontFamily: theme.typography.fontQuranUthmani, fontSize: 22, color: theme.colors.text, marginBottom: 2 },
  dailyTranslit: { fontFamily: theme.typography.fontBody, fontSize: 12, color: theme.colors.textMuted, fontStyle: 'italic' },
  dailyRight: { alignItems: 'flex-end' },
  dailyMeaning: { fontFamily: theme.typography.fontBodyBold, fontSize: 13, color: theme.colors.textSecondary, textAlign: 'right', maxWidth: 110 },
  dailyNum: { fontFamily: theme.typography.fontBody, fontSize: 11, color: theme.colors.textMuted, marginTop: 4 },

  grid: { paddingHorizontal: 10, paddingTop: 4 },
  row: { gap: 8, marginBottom: 8, paddingHorizontal: 6 },
  nameCard: {
    flex: 1, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md,
    padding: 12, borderWidth: 1, borderColor: theme.colors.borderSoft, alignItems: 'center',
    minHeight: 120,
  },
  nameCardKnown: { backgroundColor: theme.colors.successMuted, borderColor: theme.colors.success + '50' },
  nameCardDaily: { borderColor: theme.colors.accent, borderWidth: 1.5 },
  numBadge: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: theme.colors.backgroundSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  numBadgeKnown: { backgroundColor: theme.colors.success },
  numBadgeDaily: { backgroundColor: theme.colors.accent },
  numText: { fontFamily: theme.typography.fontBodyBold, fontSize: 10, color: theme.colors.textMuted },
  numTextKnown: { color: '#fff' },
  numTextDaily: { color: '#fff' },
  nameArabic: { fontFamily: theme.typography.fontQuranUthmani, fontSize: 18, color: theme.colors.textSecondary, marginBottom: 4, textAlign: 'center' },
  nameTranslit: { fontFamily: theme.typography.fontBodyMedium, fontSize: 10, color: theme.colors.accent, marginBottom: 2, textAlign: 'center' },
  nameMeaning: { fontFamily: theme.typography.fontBody, fontSize: 10, color: theme.colors.textMuted, textAlign: 'center' },
  dailyBadge: {
    marginTop: 6, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10,
    backgroundColor: theme.colors.accentMuted, fontFamily: theme.typography.fontBodyMedium,
    fontSize: 9, color: theme.colors.accent,
  },
  playingBadge: {
    marginTop: 6, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10,
    backgroundColor: theme.colors.accent, fontFamily: theme.typography.fontBodyBold,
    fontSize: 9, color: '#fff',
  },
  nameCardPlaying: {
    borderColor: theme.colors.accent, borderWidth: 2,
    backgroundColor: theme.colors.accentMuted,
  },
  numBadgePlaying: { backgroundColor: theme.colors.accent },
  numTextPlaying: { color: '#fff' },

  playAllPill: {
    height: 26,
    minWidth: 76,
    paddingHorizontal: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: theme.colors.surface,
    borderWidth: 1, borderColor: theme.colors.accent,
  },
  playAllPillActive: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  playAllPillText: {
    fontFamily: theme.typography.fontBodyBold, fontSize: 11, lineHeight: 14,
    color: theme.colors.accent, includeFontPadding: false,
  },
  playAllPillTextActive: { color: '#fff' },

  listenBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.accent, borderRadius: theme.borderRadius.md,
    paddingVertical: 12, marginBottom: 12,
  },
  listenBtnActive: { opacity: 0.92 },
  listenBtnText: {
    fontFamily: theme.typography.fontBodyBold, fontSize: 15, color: '#fff',
  },
  audioErrorText: {
    fontFamily: theme.typography.fontBody, fontSize: 12,
    color: '#b00',
    textAlign: 'center', marginBottom: 12,
  },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(28,15,6,0.5)' },
  modalSheet: {
    backgroundColor: theme.colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, maxHeight: '90%',
  },
  modalHandle: { width: 40, height: 4, backgroundColor: theme.colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalNumRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  modalNumBadge: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.accentMuted,
    borderWidth: 1.5, borderColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  modalNumText: { fontFamily: theme.typography.fontHeadingBold, fontSize: 14, color: theme.colors.accent },
  knownBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: theme.borderRadius.full,
    borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface,
  },
  knownBtnActive: { backgroundColor: theme.colors.successMuted, borderColor: theme.colors.success },
  knownBtnText: { fontFamily: theme.typography.fontBodyMedium, fontSize: 13, color: theme.colors.textMuted },
  knownBtnTextActive: { color: theme.colors.success },
  modalArabic: { fontFamily: theme.typography.fontQuranUthmani, fontSize: 36, color: theme.colors.text, textAlign: 'center', marginBottom: 6 },
  modalTranslit: { fontFamily: theme.typography.fontBodyMedium, fontSize: 16, color: theme.colors.accent, textAlign: 'center', marginBottom: 16 },
  meaningCard: {
    backgroundColor: theme.colors.accentMuted, borderRadius: theme.borderRadius.md,
    padding: 14, marginBottom: 14, borderWidth: 1, borderColor: theme.colors.border,
  },
  meaningLabel: { fontFamily: theme.typography.fontBodyMedium, fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 },
  meaningText: { fontFamily: theme.typography.fontHeadingBold, fontSize: 18, color: theme.colors.text },
  descText: { fontFamily: theme.typography.fontBody, fontSize: 14, color: theme.colors.textSecondary, lineHeight: 22, marginBottom: 16 },
  dhikrCard: {
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md,
    padding: 14, borderWidth: 1, borderColor: theme.colors.borderSoft, marginBottom: 16, alignItems: 'center',
  },
  dhikrTitle: { fontFamily: theme.typography.fontBodyBold, fontSize: 13, color: theme.colors.text, marginBottom: 4 },
  dhikrSub: { fontFamily: theme.typography.fontBody, fontSize: 12, color: theme.colors.textMuted, marginBottom: 8, textAlign: 'center' },
  dhikrArabic: { fontFamily: theme.typography.fontQuranUthmani, fontSize: 24, color: theme.colors.accent },
  modalClose: {
    backgroundColor: theme.colors.accent, borderRadius: theme.borderRadius.md,
    paddingVertical: 14, alignItems: 'center', marginTop: 4,
  },
  modalCloseText: { fontFamily: theme.typography.fontBodyBold, fontSize: 15, color: '#fff' },
});
