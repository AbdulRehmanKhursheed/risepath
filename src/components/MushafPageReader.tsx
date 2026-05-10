import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  Modal,
  BackHandler,
  FlatList,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { theme } from '../constants/theme';
import {
  fetchPage,
  prefetchAdjacentPages,
  PageContent,
  TOTAL_PAGES,
  QuranScript,
  saveLastRead,
} from '../services/quran';
import { SURAH_LIST } from '../constants/surahList';
import { WaqfLegendModal } from './WaqfLegendModal';
import { isSajdahAyah } from '../constants/sajdahList';
import { AyahSheet } from './AyahSheet';
import type { PageVerse } from '../services/quran';

type TranslationMode = 'english' | 'urdu' | 'both';

type Lang = 'en' | 'ur' | 'ar';

const SCREEN_WIDTH = Dimensions.get('window').width;
const ARABIC_INDIC = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'] as const;

// U+06DD ARABIC END OF AYAH. Renders as an ornate flower-rosette in
// Quran-aware fonts (Amiri Quran, KFGQPC, Noorehuda) with the digit visually
// inside the rosette. Falls back to a plain glyph in non-Quran fonts.
const AYAH_ROSETTE = '۝';

function toArabicIndic(n: number): string {
  return String(n).split('').map((d) => ARABIC_INDIC[parseInt(d, 10)] ?? d).join('');
}

export function MushafPageReader({
  initialPage,
  onBack,
  language,
  fs,
  script,
  setScript,
}: {
  initialPage: number;
  onBack: () => void;
  language: Lang;
  fs: (n: number) => number;
  script: QuranScript;
  setScript: (s: QuranScript) => void;
}) {
  const isUrdu = language === 'ur';
  const [page, setPage] = useState(initialPage);
  const [legendOpen, setLegendOpen] = useState(false);
  const [jumpOpen, setJumpOpen] = useState(false);
  const [jumpInput, setJumpInput] = useState('');
  const [selectedVerse, setSelectedVerse] = useState<PageVerse | null>(null);
  const translationMode: TranslationMode = isUrdu ? 'urdu' : 'english';

  const listRef = useRef<FlatList<number>>(null);
  // Page array index = page number - 1. The list is the full 604-page space;
  // FlatList virtualization keeps memory bounded while supporting jumps.
  const pages = useMemo(() => Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1), []);

  // Mark the resumed page each time the user lands here. Subsequent in-reader
  // swipes update the same record so resume is always accurate.
  useEffect(() => { saveLastRead({ type: 'page', value: page }); }, [page]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => sub.remove();
  }, [onBack]);

  const goToPage = (n: number) => {
    const clamped = Math.max(1, Math.min(TOTAL_PAGES, n));
    setPage(clamped);
    listRef.current?.scrollToIndex({ index: clamped - 1, animated: false });
  };

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    const newPage = Math.max(1, Math.min(TOTAL_PAGES, idx + 1));
    if (newPage !== page) setPage(newPage);
  };

  const onJump = () => {
    const n = parseInt(jumpInput.trim(), 10);
    if (!isNaN(n) && n >= 1 && n <= TOTAL_PAGES) {
      goToPage(n);
      setJumpOpen(false);
      setJumpInput('');
    }
  };

  return (
    <View style={styles.container}>
      <MushafTopBar
        page={page}
        isUrdu={isUrdu}
        script={script}
        setScript={setScript}
        onBack={onBack}
        onLegend={() => setLegendOpen(true)}
        onJump={() => { setJumpInput(String(page)); setJumpOpen(true); }}
      />

      <FlatList
        ref={listRef}
        data={pages}
        keyExtractor={(n) => String(n)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialNumToRender={1}
        windowSize={3}
        maxToRenderPerBatch={1}
        removeClippedSubviews
        initialScrollIndex={initialPage - 1}
        getItemLayout={(_, idx) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * idx, index: idx })}
        onMomentumScrollEnd={onMomentumEnd}
        renderItem={({ item }) => (
          <MushafPage
            pageNum={item}
            isUrdu={isUrdu}
            fs={fs}
            script={script}
            selectedVerse={selectedVerse}
            onSelectVerse={setSelectedVerse}
          />
        )}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.navBtn, page <= 1 && styles.navBtnDisabled]}
          onPress={() => goToPage(page - 1)}
          disabled={page <= 1}
        >
          <Text style={[styles.navBtnText, page <= 1 && styles.navBtnTextDisabled]}>
            ‹ {isUrdu ? 'پچھلا' : 'Prev'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.footerCenter}>
          {isUrdu ? `صفحہ ${page} / ${TOTAL_PAGES}` : `${page} / ${TOTAL_PAGES}`}
        </Text>
        <TouchableOpacity
          style={[styles.navBtn, page >= TOTAL_PAGES && styles.navBtnDisabled]}
          onPress={() => goToPage(page + 1)}
          disabled={page >= TOTAL_PAGES}
        >
          <Text style={[styles.navBtnText, page >= TOTAL_PAGES && styles.navBtnTextDisabled]}>
            {isUrdu ? 'اگلا' : 'Next'} ›
          </Text>
        </TouchableOpacity>
      </View>

      <WaqfLegendModal
        visible={legendOpen}
        onClose={() => setLegendOpen(false)}
        language={language}
      />

      <AyahSheet
        verse={selectedVerse}
        onClose={() => setSelectedVerse(null)}
        language={language}
        translationMode={translationMode}
      />

      <Modal
        visible={jumpOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setJumpOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>
              {isUrdu ? 'صفحہ نمبر درج کریں' : 'Jump to Page'}
            </Text>
            <Text style={styles.modalSub}>
              {isUrdu ? `1 سے ${TOTAL_PAGES} کے درمیان` : `Between 1 and ${TOTAL_PAGES}`}
            </Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="number-pad"
              value={jumpInput}
              onChangeText={setJumpInput}
              autoFocus
              maxLength={3}
              placeholder="1"
              placeholderTextColor={theme.colors.textMuted}
              onSubmitEditing={onJump}
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalBtnSecondary}
                onPress={() => { setJumpOpen(false); setJumpInput(''); }}
              >
                <Text style={styles.modalBtnSecondaryText}>
                  {isUrdu ? 'منسوخ' : 'Cancel'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnPrimary} onPress={onJump}>
                <Text style={styles.modalBtnPrimaryText}>
                  {isUrdu ? 'جائیں' : 'Go'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function MushafTopBar({
  page,
  isUrdu,
  script,
  setScript,
  onBack,
  onLegend,
  onJump,
}: {
  page: number;
  isUrdu: boolean;
  script: QuranScript;
  setScript: (s: QuranScript) => void;
  onBack: () => void;
  onLegend: () => void;
  onJump: () => void;
}) {
  return (
    <View style={styles.topBar}>
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.iconBtn} onPress={onBack} hitSlop={8}>
          <Text style={styles.iconBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.topTitleWrap}>
          <Text style={styles.topTitle}>
            {isUrdu ? `صفحہ ${page}` : `Page ${page}`}
          </Text>
          <Text style={styles.topSubtitle}>
            {isUrdu ? `${TOTAL_PAGES} میں سے` : `of ${TOTAL_PAGES}`}
          </Text>
        </View>
        <View style={styles.iconBtnRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={onLegend} hitSlop={8}>
            <Text style={styles.iconBtnText}>?</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={onJump} hitSlop={8}>
            <Text style={styles.iconBtnText}>⇲</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.scriptPills}>
        {(['indopak', 'uthmani'] as const).map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.scriptBtn, script === s && styles.scriptBtnActive]}
            onPress={() => setScript(s)}
          >
            <Text style={[styles.scriptBtnText, script === s && styles.scriptBtnTextActive]}>
              {s === 'indopak'
                ? isUrdu ? 'انڈو پاک' : 'Indo-Pak'
                : isUrdu ? 'مدینہ' : 'Madinah'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// MushafPage: one renderable page in the horizontal swipe list. Fetches its
// own content on mount and renders the verses with Mushaf styling — surah
// banner, Bismillah, rosette verse markers, tap-to-highlight.
function MushafPage({
  pageNum,
  isUrdu,
  fs,
  script,
  selectedVerse,
  onSelectVerse,
}: {
  pageNum: number;
  isUrdu: boolean;
  fs: (n: number) => number;
  script: QuranScript;
  selectedVerse: PageVerse | null;
  onSelectVerse: (v: PageVerse) => void;
}) {
  const [content, setContent] = useState<PageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const arabicFont =
    script === 'indopak'
      ? theme.typography.fontQuranIndopak
      : theme.typography.fontQuranUthmani;

  const bismillahText =
    script === 'indopak'
      ? 'بِسْمِ اللّٰہِ الرَّحْمٰنِ الرَّحِیْمِ'
      : 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPage(pageNum)
      .then((c) => {
        if (cancelled) return;
        setContent(c);
        setLoading(false);
        prefetchAdjacentPages(pageNum);
      })
      .catch(() => {
        if (cancelled) return;
        setError(isUrdu ? 'صفحہ لوڈ نہیں ہو سکا۔' : 'Could not load this page.');
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [pageNum, isUrdu]);

  if (loading) {
    return (
      <View style={[styles.page, styles.loadingWrap]}>
        <ActivityIndicator size="large" color={theme.colors.success} />
        <Text style={styles.loadingText}>
          {isUrdu ? 'صفحہ لوڈ ہو رہا ہے...' : 'Loading page...'}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.page, styles.loadingWrap]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!content) return <View style={styles.page} />;

  // Group verses into surah-segments so we can render a banner + Bismillah
  // when a new surah starts on the page.
  const out: React.ReactNode[] = [];
  const firstVerse = content.verses[0];
  let i = 0;
  while (i < content.verses.length) {
    const head = content.verses[i];
    const segStart = i;
    while (
      i < content.verses.length &&
      content.verses[i].surahNumber === head.surahNumber
    ) i++;
    const seg = content.verses.slice(segStart, i);

    const surahMeta = SURAH_LIST.find((s) => s.number === head.surahNumber);
    const startsHere =
      head.ayahNumber === 1 ||
      // first verse on the page that didn't start at ayah 1 of a surah: no banner
      (firstVerse && firstVerse.verseKey === head.verseKey && head.ayahNumber !== 1);

    if (head.ayahNumber === 1) {
      out.push(
        <View key={`hdr-${head.surahNumber}`} style={styles.surahBanner}>
          <View style={styles.surahBannerInner}>
            <Text style={styles.surahBannerArabic}>
              {`سُورَةُ ${surahMeta?.nameArabic ?? ''}`}
            </Text>
            <Text style={styles.surahBannerEnglish}>
              {isUrdu ? surahMeta?.nameUrdu : surahMeta?.nameEnglish}
              {'  ·  '}
              {isUrdu ? `سورۃ ${head.surahNumber}` : `Surah ${head.surahNumber}`}
            </Text>
          </View>
        </View>
      );
      if (head.surahNumber !== 9) {
        out.push(
          <Text
            key={`bism-${head.surahNumber}`}
            style={[styles.bismillah, { fontSize: fs(22), fontFamily: arabicFont }]}
          >
            {bismillahText}
          </Text>
        );
      }
    }

    out.push(
      <Text
        key={`flow-${head.surahNumber}-${segStart}`}
        style={[
          styles.mushafText,
          { fontSize: fs(24), lineHeight: fs(24) * 2.15, fontFamily: arabicFont },
        ]}
      >
        {seg.map((v) => {
          const sajdah = isSajdahAyah(v.surahNumber, v.ayahNumber);
          const isSelected = selectedVerse?.verseKey === v.verseKey;
          const arabic = script === 'indopak' && v.textIndopak ? v.textIndopak : v.textUthmani;
          return (
            <Text
              key={v.verseKey}
              onPress={() => onSelectVerse(v)}
              style={isSelected ? styles.ayahHighlight : undefined}
            >
              <Text style={{ fontFamily: arabicFont, color: theme.colors.text }}>
                {arabic}
              </Text>
              {sajdah && (
                <Text style={[styles.sajdahMark, { fontSize: fs(15) }]}>
                  {' ۩ '}
                </Text>
              )}
              <Text style={[styles.verseRosette, { fontSize: fs(22), fontFamily: arabicFont }]}>
                {` ${AYAH_ROSETTE}${toArabicIndic(v.ayahNumber)} `}
              </Text>
            </Text>
          );
        })}
      </Text>
    );

    // Header context for the top of page (first surah on the page only)
    if (segStart === 0) {
      // Pin the surah/part subheader above page body. Done by prepending out
      // with the context strip before the loop emits anything else.
      out.unshift(
        <View key="ctx" style={styles.pageContext}>
          <Text style={styles.pageContextLeft}>
            {surahMeta ? (isUrdu ? surahMeta.nameUrdu : surahMeta.nameEnglish) : ''}
          </Text>
          <Text style={styles.pageContextRight}>
            {isUrdu
              ? `پارہ ${head.juzNumber}`
              : `Part ${head.juzNumber}`}
          </Text>
        </View>
      );
    }

    // Suppress the unused 'startsHere' variable (could be used later for
    // a 'continues from previous page' marker — leaving the hook in place).
    void startsHere;
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.pageContent}
      showsVerticalScrollIndicator={false}
    >
      {out}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },

  topBar: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSoft,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  iconBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: {
    fontSize: 16,
    color: theme.colors.accent,
    fontFamily: theme.typography.fontBodyBold,
  },
  topTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  topTitle: {
    fontSize: 15,
    color: theme.colors.text,
    fontFamily: theme.typography.fontHeadingBold,
  },
  topSubtitle: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBody,
    marginTop: 1,
  },
  scriptPills: {
    flexDirection: 'row',
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: 3,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 3,
  },
  scriptBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
  },
  scriptBtnActive: { backgroundColor: theme.colors.success },
  scriptBtnText: {
    fontSize: 13,
    fontFamily: theme.typography.fontBodyMedium,
    color: theme.colors.textMuted,
  },
  scriptBtnTextActive: { color: '#fff' },

  page: {
    width: SCREEN_WIDTH,
    backgroundColor: theme.colors.background,
  },
  pageContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  pageContext: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSoft,
  },
  pageContextLeft: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBodyMedium,
    letterSpacing: 0.4,
  },
  pageContextRight: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBodyMedium,
    letterSpacing: 0.4,
  },

  surahBanner: {
    marginVertical: theme.spacing.md,
    paddingHorizontal: 4,
  },
  surahBannerInner: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.borderRadius.sm,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: theme.colors.accent,
  },
  surahBannerArabic: {
    fontSize: 26,
    color: theme.colors.accent,
    fontFamily: theme.typography.fontQuranUthmani,
    textAlign: 'center',
    lineHeight: 44,
  },
  surahBannerEnglish: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBodyMedium,
    marginTop: 6,
    letterSpacing: 0.5,
  },

  bismillah: {
    textAlign: 'center',
    color: theme.colors.success,
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },

  mushafText: {
    textAlign: 'right',
    color: theme.colors.text,
    writingDirection: 'rtl',
  },
  ayahHighlight: {
    backgroundColor: 'rgba(200, 120, 10, 0.18)',
    borderRadius: 4,
  },
  verseRosette: {
    color: theme.colors.accent,
  },
  sajdahMark: {
    color: '#B83025',
    fontFamily: theme.typography.fontQuranUthmani,
  },

  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.lg,
    width: SCREEN_WIDTH,
  },
  loadingText: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBody,
    fontSize: 15,
  },
  errorText: {
    color: theme.colors.error,
    fontFamily: theme.typography.fontBody,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
    lineHeight: 22,
    fontSize: 15,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSoft,
    backgroundColor: theme.colors.surface,
  },
  navBtn: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.accentMuted,
    minWidth: 92,
    alignItems: 'center',
  },
  navBtnDisabled: { backgroundColor: 'transparent' },
  navBtnText: {
    fontSize: 14,
    color: theme.colors.accent,
    fontFamily: theme.typography.fontBodyBold,
  },
  navBtnTextDisabled: { color: theme.colors.textMuted },
  footerCenter: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontBodyMedium,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(28, 15, 6, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  modalSheet: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    width: '100%',
    maxWidth: 360,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: theme.typography.fontHeadingBold,
    color: theme.colors.text,
  },
  modalSub: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBody,
    marginTop: 4,
  },
  modalInput: {
    fontSize: 22,
    color: theme.colors.text,
    fontFamily: theme.typography.fontBodyBold,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  modalBtnSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  modalBtnSecondaryText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontBodyMedium,
  },
  modalBtnPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
  },
  modalBtnPrimaryText: {
    fontSize: 14,
    color: '#fff',
    fontFamily: theme.typography.fontBodyBold,
  },
});
