import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Modal,
  BackHandler,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SURAH_LIST, SurahMeta } from '../constants/surahList';
import { fetchSurah, SurahContent, Ayah, QuranScript } from '../services/quran';
import { theme } from '../constants/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useSimpleMode } from '../contexts/SimpleModeContext';
import { MenuButton } from '../components/MenuButton';
import { useAudioPlayer, RECITERS, TranslationPlaybackMode } from '../hooks/useAudioPlayer';
import { prefetchAdjacent, fetchTajweedTexts, fetchIndopakTexts } from '../services/quran';
import { matchesSurah } from '../utils/surahSearch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TajweedText } from '../components/TajweedText';
import { WaqfLegendModal } from '../components/WaqfLegendModal';
import { JUZ_START_PAGE } from '../constants/juzList';
import { MushafPageReader } from '../components/MushafPageReader';
import { TOTAL_PAGES, saveLastRead, loadLastRead, LastRead } from '../services/quran';
import { isIndoPakRegion } from '../utils/region';

type TranslationMode = 'english' | 'urdu' | 'both';

// Smart-search intent parser. Lets the same search box act as a universal
// jump: "page 234", "p 234", "juz 5", "para 5", "5:1", "2:255" — all
// recognised, including Urdu variants ("صفحہ", "پارہ", "آیت"). "Para N"
// resolves to the juz's starting Mushaf page (no Juz browser). If nothing
// matches, the caller falls back to the surah-name search.
type SearchIntent =
  | { type: 'page'; value: number; viaPara?: number }
  | { type: 'verse'; surah: number; ayah: number };

function parseSearchIntent(raw: string): SearchIntent | null {
  const q = raw.trim().toLowerCase();
  if (!q) return null;

  // surah:ayah reference, e.g. "2:255" or "2 : 255"
  const versMatch = q.match(/^(\d{1,3})\s*[:،]\s*(\d{1,3})$/);
  if (versMatch) {
    const s = parseInt(versMatch[1], 10);
    const a = parseInt(versMatch[2], 10);
    if (s >= 1 && s <= 114 && a >= 1) return { type: 'verse', surah: s, ayah: a };
  }

  // page N — accepts "page", "pg", "p", and the Urdu word "صفحہ"
  const pageMatch = q.match(/^(?:page|pg|p|صفحہ|صفحه)\s*(\d{1,3})$/);
  if (pageMatch) {
    const n = parseInt(pageMatch[1], 10);
    if (n >= 1 && n <= 604) return { type: 'page', value: n };
  }

  // juz/para N — resolved to the juz's starting page; we keep `viaPara` so
  // the smart-hint card can label it as "Open Para N" instead of "Open page X".
  const juzMatch = q.match(/^(?:juz|para|پارہ|پاره|جزء)\s*(\d{1,2})$/);
  if (juzMatch) {
    const n = parseInt(juzMatch[1], 10);
    const startPage = JUZ_START_PAGE[n];
    if (n >= 1 && n <= 30 && startPage) return { type: 'page', value: startPage, viaPara: n };
  }

  return null;
}

export function QuranScreen({ initialSurah }: { initialSurah?: number }) {
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const { fs } = useSimpleMode();
  const isUrdu = language === 'ur';
  const isArabic = language === 'ar';

  const [search, setSearch] = useState('');
  const [selectedSurah, setSelectedSurah] = useState<SurahMeta | null>(
    initialSurah ? (SURAH_LIST.find((s) => s.number === initialSurah) ?? null) : null
  );
  const [surahContent, setSurahContent] = useState<SurahContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [translationMode, setTranslationMode] = useState<TranslationMode>('urdu');
  const [reciterPickerOpen, setReciterPickerOpen] = useState(false);
  const [reciterSearch, setReciterSearch] = useState('');
  const [translationAudioEnabled, setTranslationAudioEnabled] = useState(false);
  const [viewMode, setViewMode] = useState<'verse' | 'mushaf'>('verse');
  const [tajweedOn, setTajweedOn] = useState(false);
  const [tajweedTexts, setTajweedTexts] = useState<string[] | null>(null);
  const [tajweedLoading, setTajweedLoading] = useState(false);
  // Reading style. IndoPak is the script Pakistani/Indian readers grew up
  // with from physical Mushafs; Uthmani is the Madinah Mushaf used worldwide.
  // Default intelligently: Urdu users OR users in Indo-Pak timezones get
  // IndoPak by default; everyone else gets Uthmani. The persisted choice
  // wins on subsequent launches.
  const [script, setScript] = useState<QuranScript>(
    isUrdu || isIndoPakRegion() ? 'indopak' : 'uthmani'
  );
  const [indopakTexts, setIndopakTexts] = useState<string[] | null>(null);
  const [indopakLoading, setIndopakLoading] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState<number | null>(null);
  const [lastRead, setLastRead] = useState<LastRead | null>(null);
  const arabicFont =
    script === 'indopak'
      ? theme.typography.fontQuranIndopak
      : theme.typography.fontQuranUthmani;
  // Bismillah comes from the API for non-9 surahs, but we render a fixed copy
  // at the top of the reader. Each script writes it slightly differently.
  const bismillahText =
    script === 'indopak'
      ? 'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِیْمِ'
      : 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';

  const translationPlayback: TranslationPlaybackMode = translationAudioEnabled
    ? translationMode
    : 'off';

  const scrollRef = useRef<ScrollView>(null);
  const ayahYRef = useRef<Record<number, number>>({});

  const {
    currentIndex: playingIndex,
    playingLang,
    pbStatus,
    currentReciter,
    playAtIndex,
    togglePlayPause,
    nextAyah,
    prevAyah,
    stop,
    retry,
    changeReciter,
  } = useAudioPlayer(
    selectedSurah?.number ?? null,
    surahContent?.ayahs ?? [],
    translationPlayback
  );

  // Tajweed key is versioned (`_v2`) so any device that previously persisted
  // 'on' under the old `quran_tajweed` key is ignored. Default state stays
  // false, so every fresh launch is Tajweed-off until the user toggles it on.
  useEffect(() => {
    (async () => {
      try {
        const [vm, tj, sc, lr] = await Promise.all([
          AsyncStorage.getItem('quran_view_mode'),
          AsyncStorage.getItem('quran_tajweed_v2'),
          AsyncStorage.getItem('quran_script_v1'),
          loadLastRead(),
        ]);
        if (vm === 'mushaf') setViewMode('mushaf');
        if (tj === 'on') setTajweedOn(true);
        if (sc === 'indopak' || sc === 'uthmani') setScript(sc);
        if (lr) setLastRead(lr);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (!tajweedOn || !selectedSurah || script !== 'uthmani') { setTajweedTexts(null); return; }
    let cancelled = false;
    setTajweedLoading(true);
    fetchTajweedTexts(selectedSurah.number)
      .then(texts => { if (!cancelled) setTajweedTexts(texts); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setTajweedLoading(false); });
    return () => { cancelled = true; };
  }, [tajweedOn, selectedSurah?.number, script]);

  // Pull IndoPak text whenever the user is on IndoPak script and a surah
  // is open. Cached per-surah; flips between scripts are instant after
  // first fetch.
  useEffect(() => {
    if (script !== 'indopak' || !selectedSurah) { setIndopakTexts(null); return; }
    let cancelled = false;
    setIndopakLoading(true);
    fetchIndopakTexts(selectedSurah.number)
      .then(texts => { if (!cancelled) setIndopakTexts(texts); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setIndopakLoading(false); });
    return () => { cancelled = true; };
  }, [script, selectedSurah?.number]);

  const openSurah = useCallback(async (surah: SurahMeta) => {
    await stop();
    setSelectedSurah(surah);
    setSurahContent(null);
    setTajweedTexts(null);
    setIndopakTexts(null);
    setError(null);
    setLoading(true);
    ayahYRef.current = {};
    saveLastRead({ type: 'surah', value: surah.number });
    try {
      const content = await fetchSurah(surah.number);
      setSurahContent(content);
      prefetchAdjacent(surah.number);
    } catch {
      setError(isUrdu ? 'لوڈ نہیں ہو سکا۔ انٹرنیٹ چیک کریں۔' : 'Could not load. Check your internet connection.');
    } finally {
      setLoading(false);
    }
  }, [isUrdu, stop]);

  useEffect(() => {
    if (initialSurah) {
      const surah = SURAH_LIST.find((s) => s.number === initialSurah);
      if (surah) openSurah(surah);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = SURAH_LIST.filter((s) => matchesSurah(s, search));

  const isPlayerActive = playingIndex !== null;

  useEffect(() => {
    if (playingIndex === null) return;
    const y = ayahYRef.current[playingIndex];
    if (y === undefined) return;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 80), animated: true });
  }, [playingIndex]);

  useEffect(() => {
    if (!selectedSurah && selectedPage === null) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      (async () => {
        await stop();
        if (selectedPage !== null) {
          setSelectedPage(null);
        } else {
          setSelectedSurah(null);
          setSurahContent(null);
        }
      })();
      return true;
    });
    return () => sub.remove();
  }, [selectedSurah, selectedPage, stop]);

  if (selectedPage !== null) {
    return (
      <MushafPageReader
        initialPage={selectedPage}
        onBack={() => {
          // Refresh the unified last-read pointer from storage so the resume
          // card on the landing reflects whatever page we left off on.
          loadLastRead().then((lr) => { if (lr) setLastRead(lr); });
          setSelectedPage(null);
        }}
        language={language}
        fs={fs}
        script={script}
        setScript={(s) => {
          setScript(s);
          AsyncStorage.setItem('quran_script_v1', s).catch(() => {});
        }}
      />
    );
  }

  if (selectedSurah) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(26, 122, 60, 0.08)', 'transparent']}
          style={styles.heroGradient}
          pointerEvents="none"
        />

        <View style={styles.readerHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={async () => { await stop(); setSelectedSurah(null); setSurahContent(null); }}
          >
            <Text style={styles.backBtnText}>← {isUrdu ? 'فہرست' : 'List'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.legendBtn}
            onPress={() => setLegendOpen(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.legendBtnText}>?</Text>
          </TouchableOpacity>
          <View style={styles.readerTitleWrap}>
            <Text style={styles.readerArabicTitle}>{selectedSurah.nameArabic}</Text>
            <Text style={styles.readerEnglishTitle}>
              {isUrdu ? selectedSurah.nameUrdu : selectedSurah.nameEnglish}
              {'  ·  '}{selectedSurah.ayahs} {isUrdu ? 'آیات' : 'ayahs'}
            </Text>
          </View>
        </View>

        <WaqfLegendModal
          visible={legendOpen}
          onClose={() => setLegendOpen(false)}
          language={language}
        />

        <View style={styles.viewModeRow}>
          <View style={styles.viewModePills}>
            {(['verse', 'mushaf'] as const).map(mode => (
              <TouchableOpacity
                key={mode}
                style={[styles.viewModeBtn, viewMode === mode && styles.viewModeBtnActive]}
                onPress={() => {
                  setViewMode(mode);
                  AsyncStorage.setItem('quran_view_mode', mode).catch(() => {});
                }}
              >
                <Text style={[styles.viewModeBtnText, viewMode === mode && styles.viewModeBtnTextActive]}>
                  {mode === 'verse' ? (isUrdu ? 'آیت آیت' : 'Verse') : (isUrdu ? 'قرآن' : 'Quran')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.viewModeRow}>
          <View style={styles.viewModePills}>
            {(['indopak', 'uthmani'] as const).map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.viewModeBtn, script === s && styles.viewModeBtnActive]}
                onPress={() => {
                  setScript(s);
                  AsyncStorage.setItem('quran_script_v1', s).catch(() => {});
                  // Tajweed coloring is Uthmani-only; flipping to IndoPak
                  // disables it so we don't paint colors on a different text.
                  if (s === 'indopak' && tajweedOn) {
                    setTajweedOn(false);
                    AsyncStorage.setItem('quran_tajweed_v2', 'off').catch(() => {});
                  }
                }}
              >
                <Text style={[styles.viewModeBtnText, script === s && styles.viewModeBtnTextActive]}>
                  {s === 'indopak'
                    ? (isUrdu ? 'انڈو پاک' : 'Indo-Pak')
                    : (isUrdu ? 'مدینہ' : 'Madinah')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {script === 'uthmani' && (
            <TouchableOpacity
              style={[styles.tajweedBtn, tajweedOn && styles.tajweedBtnOn]}
              onPress={() => {
                const next = !tajweedOn;
                setTajweedOn(next);
                AsyncStorage.setItem('quran_tajweed_v2', next ? 'on' : 'off').catch(() => {});
              }}
            >
              {tajweedLoading
                ? <ActivityIndicator size="small" color="#FF8000" />
                : <Text style={[styles.tajweedBtnText, tajweedOn && styles.tajweedBtnTextOn]}>
                    {isUrdu ? 'تجوید' : 'Tajweed'}
                  </Text>
              }
            </TouchableOpacity>
          )}
        </View>

        {viewMode === 'verse' && (
        <View style={styles.toggleRow}>
          {(['urdu', 'english', 'both'] as TranslationMode[]).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[styles.toggleBtn, translationMode === mode && styles.toggleBtnActive]}
              onPress={() => setTranslationMode(mode)}
            >
              <Text style={[styles.toggleBtnText, translationMode === mode && styles.toggleBtnTextActive]}>
                {mode === 'urdu' ? 'اردو' : mode === 'english' ? 'English' : isUrdu ? 'دونوں' : 'Both'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        )}

        <TouchableOpacity
          style={styles.reciterChip}
          onPress={() => setReciterPickerOpen(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.reciterChipIcon}>🎙</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.reciterChipLabel, { fontSize: fs(11) }]}>
              {isUrdu ? 'قاری' : isArabic ? 'القارئ' : 'RECITER'}
            </Text>
            <Text style={[styles.reciterChipName, { fontSize: fs(14) }]} numberOfLines={1}>
              {isUrdu ? currentReciter.nameUr : isArabic ? currentReciter.nameAr : currentReciter.nameEn}
            </Text>
          </View>
          <Text style={styles.reciterChipArrow}>›</Text>
        </TouchableOpacity>

        {viewMode === 'verse' && (
        <TouchableOpacity
          style={[styles.transAudioRow, translationAudioEnabled && styles.transAudioRowOn]}
          onPress={() => setTranslationAudioEnabled((v) => !v)}
          activeOpacity={0.85}
        >
          <Text style={styles.transAudioIcon}>{translationAudioEnabled ? '🔊' : '🔇'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.transAudioTitle, { fontSize: fs(13) }, translationAudioEnabled && styles.transAudioTitleOn]}>
              {isUrdu
                ? 'ترجمہ بھی سنیں'
                : isArabic
                ? 'تشغيل ترجمة صوتية'
                : 'Recite translation too'}
            </Text>
            <Text style={[styles.transAudioSub, { fontSize: fs(11) }]}>
              {translationAudioEnabled
                ? (isUrdu
                    ? `عربی کے بعد ${translationMode === 'both' ? 'اردو + انگریزی' : translationMode === 'english' ? 'انگریزی' : 'اردو'}`
                    : isArabic
                    ? 'بعد العربية'
                    : `After Arabic · ${translationMode === 'both' ? 'Urdu + English' : translationMode === 'english' ? 'English' : 'Urdu'}`)
                : (isUrdu
                    ? 'صرف عربی تلاوت'
                    : isArabic
                    ? 'عربي فقط'
                    : 'Arabic only')}
            </Text>
          </View>
          <View style={[styles.toggleSwitch, translationAudioEnabled && styles.toggleSwitchOn]}>
            <View style={[styles.toggleKnob, translationAudioEnabled && styles.toggleKnobOn]} />
          </View>
        </TouchableOpacity>
        )}

        {loading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={theme.colors.success} />
            <Text style={styles.loadingText}>
              {isUrdu ? 'لوڈ ہو رہا ہے...' : 'Loading surah...'}
            </Text>
          </View>
        )}

        {error && (
          <View style={styles.errorWrap}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => openSurah(selectedSurah)}>
              <Text style={styles.retryBtnText}>{isUrdu ? 'دوبارہ کوشش' : 'Retry'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {surahContent && (
          <View style={{ flex: 1 }}>
            {viewMode === 'mushaf' ? (
              <ScrollView
                ref={scrollRef}
                style={styles.ayahList}
                contentContainerStyle={[styles.mushafContent, { paddingBottom: isPlayerActive ? 84 : theme.spacing.xxxl }]}
                showsVerticalScrollIndicator={false}
              >
                {selectedSurah.number !== 9 && (
                  <Text style={[styles.bismillah, { fontSize: fs(24), fontFamily: arabicFont }]}>
                    {bismillahText}
                  </Text>
                )}
                <Text style={[styles.mushafText, { fontSize: fs(26), lineHeight: fs(26) * 2.1, fontFamily: arabicFont }]}>
                  {surahContent.ayahs.map((ayah, idx) => {
                    const indopakText = script === 'indopak' ? indopakTexts?.[idx] : null;
                    return (
                      <React.Fragment key={ayah.numberInSurah}>
                        {tajweedOn && tajweedTexts && script === 'uthmani'
                          ? <TajweedText text={tajweedTexts[idx] ?? ayah.arabic} style={[styles.mushafAyahText, { fontSize: fs(26), fontFamily: arabicFont }]} />
                          : <Text style={[styles.mushafAyahText, { fontSize: fs(26), fontFamily: arabicFont }]}>{indopakText ?? ayah.arabic}</Text>
                        }
                        <Text style={[styles.mushafVerseNum, { fontSize: fs(14) }]}>{` ﴿${ayah.numberInSurah}﴾ `}</Text>
                      </React.Fragment>
                    );
                  })}
                </Text>
              </ScrollView>
            ) : (
            <ScrollView
              ref={scrollRef}
              style={styles.ayahList}
              contentContainerStyle={[
                styles.ayahListContent,
                { paddingBottom: isPlayerActive ? 84 : theme.spacing.xxxl },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {/* Bismillah omitted for Surah 9 (At-Tawbah) by convention. */}
              {selectedSurah.number !== 9 && (
                <Text style={[styles.bismillah, { fontSize: fs(22), fontFamily: arabicFont }]}>
                  {bismillahText}
                </Text>
              )}

              {surahContent.ayahs.map((ayah, idx) => {
                const isPlaying = playingIndex === idx;
                const indopakText = script === 'indopak' ? indopakTexts?.[idx] : null;
                return (
                  <View
                    key={ayah.numberInSurah}
                    style={[styles.ayahCard, isPlaying && styles.ayahCardPlaying]}
                    onLayout={(e) => { ayahYRef.current[idx] = e.nativeEvent.layout.y; }}
                  >
                    <View style={styles.ayahTopRow}>
                      <TouchableOpacity
                        style={[styles.ayahPlayBtn, isPlaying && styles.ayahPlayBtnActive]}
                        onPress={() => {
                          if (isPlaying) {
                            togglePlayPause();
                          } else {
                            playAtIndex(idx);
                          }
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={[styles.ayahPlayBtnIcon, isPlaying && styles.ayahPlayBtnIconActive]}>
                          {isPlaying && pbStatus === 'playing' ? '⏸' : isPlaying && pbStatus === 'loading' ? '…' : '▶'}
                        </Text>
                      </TouchableOpacity>

                      <View style={styles.ayahNumBadge}>
                        <Text style={styles.ayahNumText}>{ayah.numberInSurah}</Text>
                      </View>
                    </View>

                    {tajweedOn && tajweedTexts && script === 'uthmani'
                      ? <TajweedText text={tajweedTexts[idx] ?? ayah.arabic} style={[styles.ayahArabic, { fontSize: fs(20), fontFamily: arabicFont }]} />
                      : <Text style={[styles.ayahArabic, { fontSize: fs(20), fontFamily: arabicFont }]}>{indopakText ?? ayah.arabic}</Text>
                    }

                    {(translationMode === 'urdu' || translationMode === 'both') && (
                      <Text style={[styles.ayahUrdu, { fontSize: fs(14) }]}>{ayah.urdu}</Text>
                    )}
                    {(translationMode === 'english' || translationMode === 'both') && (
                      <Text style={[styles.ayahEnglish, { fontSize: fs(13) }]}>{ayah.english}</Text>
                    )}
                  </View>
                );
              })}
            </ScrollView>
            )}

            {isPlayerActive && surahContent && (
              <View style={[styles.playerBar, { paddingBottom: Math.max(10, insets.bottom + 10) }]}>
                <View style={styles.playerInfo}>
                  <View style={styles.playerAyahLine}>
                    <Text style={[styles.playerAyahNum, { fontSize: fs(11) }]}>
                      {isUrdu ? 'آیت' : isArabic ? 'آية' : 'Ayah'}{' '}
                      {surahContent.ayahs[playingIndex]?.numberInSurah ?? ''}
                    </Text>
                    {translationAudioEnabled && (
                      <View style={styles.langPill}>
                        <Text style={styles.langPillText}>
                          {playingLang === 'arabic'
                            ? (isUrdu ? 'عربی' : 'AR')
                            : playingLang === 'urdu'
                            ? 'UR'
                            : 'EN'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => setReciterPickerOpen(true)}>
                    <Text style={[styles.playerReciterName, { fontSize: fs(12) }]} numberOfLines={1}>
                      {isUrdu ? currentReciter.nameUr : isArabic ? currentReciter.nameAr : currentReciter.nameEn}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.playerControls}>
                  <TouchableOpacity style={styles.playerBtn} onPress={prevAyah}>
                    <Text style={styles.playerBtnIcon}>⏮</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.playerPlayPauseBtn}
                    onPress={pbStatus === 'error' ? retry : togglePlayPause}
                  >
                    {pbStatus === 'loading' ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.playerPlayPauseIcon}>
                        {pbStatus === 'error' ? '↻' : pbStatus === 'playing' ? '⏸' : '▶'}
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.playerBtn} onPress={nextAyah}>
                    <Text style={styles.playerBtnIcon}>⏭</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.playerStopBtn} onPress={stop}>
                  <Text style={styles.playerStopIcon}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <Modal
          visible={reciterPickerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => { setReciterPickerOpen(false); setReciterSearch(''); }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={[styles.modalTitle, { fontSize: fs(17) }]}>
                {isUrdu ? 'قاری منتخب کریں' : isArabic ? 'اختر القارئ' : 'Choose Reciter'}
              </Text>

              <TextInput
                style={styles.reciterSearchInput}
                value={reciterSearch}
                onChangeText={setReciterSearch}
                placeholder={isUrdu ? 'قاری تلاش کریں...' : isArabic ? 'ابحث عن قارئ...' : 'Search reciters...'}
                placeholderTextColor={theme.colors.textMuted}
                autoCorrect={false}
                autoCapitalize="none"
              />

              <ScrollView style={styles.reciterList} keyboardShouldPersistTaps="handled">
                {(() => {
                  const q = reciterSearch.trim().toLowerCase();
                  const list = q
                    ? RECITERS.filter((r) =>
                        r.nameEn.toLowerCase().includes(q) ||
                        r.nameAr.includes(q) ||
                        r.nameUr.includes(q)
                      )
                    : RECITERS;
                  if (list.length === 0) {
                    return (
                      <Text style={styles.reciterEmpty}>
                        {isUrdu ? 'کوئی قاری نہیں ملا' : isArabic ? 'لم يتم العثور على قارئ' : 'No reciters found'}
                      </Text>
                    );
                  }
                  return list.map((r) => {
                    const selected = r.id === currentReciter.id;
                    return (
                      <TouchableOpacity
                        key={r.id}
                        style={[styles.reciterOption, selected && styles.reciterOptionSelected]}
                        onPress={() => { changeReciter(r.id); setReciterPickerOpen(false); setReciterSearch(''); }}
                        activeOpacity={0.8}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.reciterNameEn, { fontSize: fs(14) }, selected && styles.reciterNameSelected]}>
                            {isUrdu ? r.nameUr : r.nameEn}
                          </Text>
                          <Text style={[styles.reciterNameAr, { fontSize: fs(13) }]}>{r.nameAr}</Text>
                        </View>
                        {selected && <Text style={styles.reciterCheck}>✓</Text>}
                      </TouchableOpacity>
                    );
                  });
                })()}
              </ScrollView>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => { setReciterPickerOpen(false); setReciterSearch(''); }}
              >
                <Text style={styles.modalCloseBtnText}>
                  {isUrdu ? 'بند کریں' : isArabic ? 'إغلاق' : 'Close'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(26, 122, 60, 0.08)', 'transparent']}
        style={styles.heroGradient}
        pointerEvents="none"
      />

      <View style={styles.browserHeader}>
        <View style={styles.browserTitleRow}>
          <View style={styles.browserTitleBlock}>
            <Text style={[styles.browserTitle, { fontSize: fs(28) }]}>
              {isUrdu ? 'قرآن مجید' : isArabic ? 'القرآن الكريم' : 'Quran'}
            </Text>
            <Text style={[styles.browserSubtitle, { fontSize: fs(13) }]}>
              {isUrdu
                ? '۱۱۴ سورتیں — عربی + اردو + انگریزی + تلاوت'
                : isArabic
                ? '١١٤ سورة · عربي + ترجمة + تلاوة'
                : '114 Surahs · Arabic + Urdu + English + Audio'}
            </Text>
          </View>
          <MenuButton />
        </View>
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { fontSize: fs(14) }]}
            placeholder={
              isUrdu
                ? 'سورہ، پارہ ۵، صفحہ ۲۳۴، یا ۲:۲۵۵'
                : isArabic
                ? 'سورة، صفحة ٢٣٤، أو ٢:٢٥٥'
                : 'Search surah, para 5, page 234, 2:255...'
            }
            placeholderTextColor={theme.colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {lastRead && (() => {
          const lr = lastRead;
          const label = isUrdu ? 'وہیں سے جاری رکھیں' : 'Continue Reading';
          let title = '';
          let sub = '';
          if (lr.type === 'page') {
            title = isUrdu ? `صفحہ ${lr.value}` : `Page ${lr.value}`;
            sub = isUrdu ? `${TOTAL_PAGES} میں سے` : `of ${TOTAL_PAGES}`;
          } else {
            const s = SURAH_LIST.find((x) => x.number === lr.value);
            title = s ? (isUrdu ? s.nameUrdu : s.nameEnglish) : '';
            sub = isUrdu ? `سورۃ ${lr.value}` : `Surah ${lr.value}`;
          }
          return (
            <TouchableOpacity
              style={styles.resumeCard}
              activeOpacity={0.85}
              onPress={() => {
                if (lr.type === 'page') setSelectedPage(lr.value);
                else {
                  const s = SURAH_LIST.find((x) => x.number === lr.value);
                  if (s) openSurah(s);
                }
              }}
            >
              <View style={styles.resumeIconBox}>
                <Text style={styles.resumeIcon}>📖</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.resumeLabel, { fontSize: fs(11) }]}>{label}</Text>
                <Text style={[styles.resumeTitle, { fontSize: fs(18) }]}>{title}</Text>
                <Text style={[styles.resumeSub, { fontSize: fs(12) }]}>{sub}</Text>
              </View>
              <Text style={styles.resumeArrow}>›</Text>
            </TouchableOpacity>
          );
        })()}

        {(() => {
          const intent = parseSearchIntent(search);
          if (!intent) return null;
          const onTap = () => {
            if (intent.type === 'page') {
              setSelectedPage(intent.value);
              setSearch('');
            } else if (intent.type === 'verse') {
              const s = SURAH_LIST.find((x) => x.number === intent.surah);
              if (s) { openSurah(s); setSearch(''); }
            }
          };
          let line = '';
          if (intent.type === 'page') {
            if (intent.viaPara) {
              line = isUrdu
                ? `پارہ ${intent.viaPara} (صفحہ ${intent.value}) پر جائیں`
                : `Open Para ${intent.viaPara} (page ${intent.value})`;
            } else {
              line = isUrdu
                ? `صفحہ ${intent.value} پر جائیں`
                : `Open page ${intent.value}`;
            }
          } else {
            const s = SURAH_LIST.find((x) => x.number === intent.surah);
            line = isUrdu
              ? `${s?.nameUrdu ?? ''} ${intent.surah}:${intent.ayah} کھولیں`
              : `Open ${s?.nameEnglish ?? `Surah ${intent.surah}`} ${intent.surah}:${intent.ayah}`;
          }
          return (
            <TouchableOpacity
              style={styles.smartHintCard}
              activeOpacity={0.85}
              onPress={onTap}
            >
              <Text style={styles.smartHintIcon}>→</Text>
              <Text style={[styles.smartHintText, { fontSize: fs(13) }]}>{line}</Text>
            </TouchableOpacity>
          );
        })()}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.number)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.surahRow}
            onPress={() => openSurah(item)}
            activeOpacity={0.8}
          >
            <View style={styles.surahNumBadge}>
              <Text style={styles.surahNumText}>{item.number}</Text>
            </View>
            <View style={styles.surahInfo}>
              <Text style={[styles.surahNameAr, { fontSize: fs(17) }]}>{item.nameArabic}</Text>
              <Text style={[styles.surahNameEn, { fontSize: fs(12) }]}>
                {isUrdu ? item.nameUrdu : item.nameEnglish}
                {'  ·  '}{item.meaning}
              </Text>
            </View>
            <View style={styles.surahRight}>
              <Text style={[styles.surahAyahs, { fontSize: fs(11) }]}>
                {item.ayahs} {isUrdu ? 'آیات' : 'ayahs'}
              </Text>
              <Text style={[
                styles.surahType,
                { backgroundColor: item.revelationType === 'Meccan'
                    ? 'rgba(200,120,10,0.12)'
                    : 'rgba(26,122,60,0.12)' }
              ]}>
                {item.revelationType === 'Meccan'
                  ? (isUrdu ? 'مکی' : 'Meccan')
                  : (isUrdu ? 'مدنی' : 'Medinan')}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
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
    top: 0, left: 0, right: 0,
    height: 200,
  },
  browserHeader: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.md,
  },
  browserTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  browserTitleBlock: {
    flex: 1,
    paddingRight: theme.spacing.md,
  },
  browserTitle: {
    fontFamily: theme.typography.fontHeadingBold,
    color: theme.colors.text,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  browserSubtitle: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBody,
    marginTop: 4,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    paddingVertical: 11,
    color: theme.colors.text,
    fontFamily: theme.typography.fontBody,
  },
  clearBtn: {
    fontSize: 14,
    color: theme.colors.textMuted,
    paddingHorizontal: 4,
  },
  listContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl,
  },
  surahRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
    ...Platform.select({
      ios: { shadowColor: '#7A5A40', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  surahNumBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.successMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  surahNumText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.success,
    fontFamily: theme.typography.fontBodyBold,
  },
  surahInfo: { flex: 1 },
  surahNameAr: {
    color: theme.colors.text,
    fontFamily: theme.typography.fontQuranUthmani,
    fontWeight: '600',
  },
  surahNameEn: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBody,
    marginTop: 2,
  },
  surahRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  surahAyahs: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBody,
  },
  surahType: {
    fontSize: 10,
    fontFamily: theme.typography.fontBodyBold,
    color: theme.colors.textMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  resumeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.accent,
    gap: theme.spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
      },
      android: { elevation: 3 },
    }),
  },
  resumeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumeIcon: {
    fontSize: 22,
  },
  resumeLabel: {
    color: theme.colors.accent,
    fontFamily: theme.typography.fontBodyBold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  resumeTitle: {
    color: theme.colors.text,
    fontFamily: theme.typography.fontBodyBold,
    marginTop: 2,
  },
  resumeSub: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBody,
    marginTop: 1,
  },
  resumeArrow: {
    fontSize: 28,
    color: theme.colors.accent,
  },
  smartHintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.successMuted,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(26, 122, 60, 0.3)',
    gap: theme.spacing.sm,
  },
  smartHintIcon: {
    fontSize: 16,
    color: theme.colors.success,
    fontFamily: theme.typography.fontBodyBold,
  },
  smartHintText: {
    flex: 1,
    color: theme.colors.success,
    fontFamily: theme.typography.fontBodyMedium,
  },
  pageBrowserContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl,
    paddingTop: theme.spacing.sm,
  },
  continueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.successMuted,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(26, 122, 60, 0.3)',
    gap: theme.spacing.md,
  },
  continueLabel: {
    fontSize: 11,
    color: theme.colors.success,
    fontFamily: theme.typography.fontBodyBold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  continueValue: {
    fontSize: 16,
    color: theme.colors.text,
    fontFamily: theme.typography.fontBodyBold,
    marginTop: 4,
  },
  continueArrow: {
    fontSize: 24,
    color: theme.colors.success,
  },
  pageBrowserSection: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBodyBold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  pageJumpRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  pageJumpInput: {
    flex: 1,
    fontSize: 18,
    color: theme.colors.text,
    fontFamily: theme.typography.fontBodyBold,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    textAlign: 'center',
  },
  pageJumpBtn: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 12,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  pageJumpBtnText: {
    fontSize: 14,
    color: '#fff',
    fontFamily: theme.typography.fontBodyBold,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickGridBtn: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minWidth: 88,
    alignItems: 'center',
  },
  quickGridBtnText: {
    fontSize: 13,
    color: theme.colors.accent,
    fontFamily: theme.typography.fontBodyMedium,
  },
  pageBrowserHint: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBody,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: theme.spacing.lg,
    lineHeight: 16,
  },
  readerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.md,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  backBtnText: {
    fontSize: 13,
    color: theme.colors.accent,
    fontFamily: theme.typography.fontBodyMedium,
  },
  legendBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendBtnText: {
    fontSize: 15,
    fontFamily: theme.typography.fontBodyBold,
    color: theme.colors.accent,
    lineHeight: 18,
  },
  readerTitleWrap: {
    flex: 1,
    alignItems: 'flex-end',
  },
  readerArabicTitle: {
    fontSize: 22,
    color: theme.colors.text,
    fontFamily: theme.typography.fontQuranUthmani,
  },
  readerEnglishTitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBody,
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: 3,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 3,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
  },
  toggleBtnActive: { backgroundColor: theme.colors.success },
  toggleBtnText: {
    fontSize: 13,
    fontFamily: theme.typography.fontBodyMedium,
    color: theme.colors.textMuted,
  },
  toggleBtnTextActive: { color: '#fff' },
  transAudioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.md,
  },
  transAudioRowOn: {
    borderColor: theme.colors.success,
    backgroundColor: theme.colors.successMuted,
  },
  transAudioIcon: {
    fontSize: 18,
  },
  transAudioTitle: {
    fontFamily: theme.typography.fontBodyBold,
    color: theme.colors.text,
  },
  transAudioTitleOn: {
    color: theme.colors.success,
  },
  transAudioSub: {
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  loadingText: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBody,
    fontSize: 15,
  },
  errorWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  errorText: {
    color: theme.colors.error,
    fontFamily: theme.typography.fontBody,
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 15,
  },
  retryBtn: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.md,
  },
  retryBtnText: {
    color: '#fff',
    fontFamily: theme.typography.fontBodyBold,
    fontSize: 14,
  },
  viewModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  viewModePills: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: 3,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 3,
  },
  viewModeBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
  },
  viewModeBtnActive: { backgroundColor: theme.colors.success },
  viewModeBtnText: {
    fontSize: 13,
    fontFamily: theme.typography.fontBodyMedium,
    color: theme.colors.textMuted,
  },
  viewModeBtnTextActive: { color: '#fff' },
  tajweedBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    minWidth: 72,
    alignItems: 'center',
  },
  tajweedBtnOn: {
    borderColor: '#FF8000',
    backgroundColor: 'rgba(255, 128, 0, 0.08)',
  },
  tajweedBtnText: {
    fontSize: 13,
    fontFamily: theme.typography.fontBodyMedium,
    color: theme.colors.textMuted,
  },
  tajweedBtnTextOn: { color: '#FF8000' },
  mushafContent: {
    paddingHorizontal: theme.spacing.xl,
  },
  mushafText: {
    textAlign: 'right',
    color: theme.colors.text,
    fontFamily: theme.typography.fontBody,
    writingDirection: 'rtl',
  },
  mushafAyahText: {
    color: theme.colors.text,
    fontFamily: theme.typography.fontBody,
  },
  mushafVerseNum: {
    color: theme.colors.success,
    fontFamily: theme.typography.fontBody,
  },
  ayahList: { flex: 1 },
  ayahListContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl,
  },
  bismillah: {
    textAlign: 'center',
    color: theme.colors.success,
    fontFamily: theme.typography.fontBody,
    lineHeight: 38,
    marginBottom: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSoft,
  },
  ayahCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  ayahCardPlaying: {
    borderColor: theme.colors.success,
    backgroundColor: 'rgba(26, 122, 60, 0.04)',
  },
  ayahTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ayahPlayBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.successMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ayahPlayBtnActive: {
    backgroundColor: theme.colors.success,
  },
  ayahPlayBtnIcon: {
    fontSize: 11,
    color: theme.colors.success,
  },
  ayahPlayBtnIconActive: {
    color: '#fff',
  },
  ayahNumBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ayahNumText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.accent,
    fontFamily: theme.typography.fontBodyBold,
  },
  ayahArabic: {
    textAlign: 'right',
    color: theme.colors.text,
    fontFamily: theme.typography.fontBody,
    lineHeight: 38,
    marginBottom: 10,
  },
  ayahUrdu: {
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontBody,
    lineHeight: 24,
    textAlign: 'right',
    marginBottom: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSoft,
  },
  ayahEnglish: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBody,
    lineHeight: 20,
    fontStyle: 'italic',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSoft,
  },

  playerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    backgroundColor: '#1C2E1A',
    borderTopWidth: 1,
    borderTopColor: 'rgba(26,122,60,0.3)',
    gap: theme.spacing.sm,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.3, shadowRadius: 12 },
      android: { elevation: 12 },
    }),
  },
  playerInfo: {
    flex: 1,
    gap: 2,
  },
  playerAyahLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerAyahNum: {
    color: 'rgba(255,255,255,0.6)',
    fontFamily: theme.typography.fontBodyMedium,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  langPill: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  langPillText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: theme.typography.fontBodyBold,
    letterSpacing: 0.5,
  },
  playerReciterName: {
    color: '#FFFFFF',
    fontFamily: theme.typography.fontBodyBold,
  },
  playerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  playerBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerBtnIcon: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
  },
  playerPlayPauseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#1A7A3C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 6 },
      android: { elevation: 4 },
    }),
  },
  playerPlayPauseIcon: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  playerStopBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  playerStopIcon: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(28,15,6,0.55)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.18, shadowRadius: 20 },
      android: { elevation: 16 },
    }),
  },
  modalTitle: {
    fontFamily: theme.typography.fontHeadingBold,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  toggleSwitch: {
    width: 40,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.border,
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchOn: {
    backgroundColor: theme.colors.success,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  toggleKnobOn: {
    transform: [{ translateX: 16 }],
  },
  reciterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  reciterChipIcon: {
    fontSize: 20,
  },
  reciterChipLabel: {
    fontFamily: theme.typography.fontBodyBold,
    color: theme.colors.textMuted,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  reciterChipName: {
    fontFamily: theme.typography.fontBodyBold,
    color: theme.colors.text,
    marginTop: 1,
  },
  reciterChipArrow: {
    fontSize: 22,
    color: theme.colors.textMuted,
    lineHeight: 24,
  },
  reciterSearchInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: theme.typography.fontBody,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.md,
  },
  reciterList: {
    maxHeight: 360,
  },
  reciterEmpty: {
    textAlign: 'center',
    paddingVertical: theme.spacing.xl,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBody,
    fontSize: 14,
  },
  reciterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    marginBottom: 8,
    gap: theme.spacing.sm,
  },
  reciterOptionSelected: {
    borderColor: theme.colors.success,
    backgroundColor: theme.colors.successMuted,
  },
  reciterNameEn: {
    fontFamily: theme.typography.fontBodyBold,
    color: theme.colors.text,
  },
  reciterNameSelected: {
    color: theme.colors.success,
  },
  reciterNameAr: {
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
    marginTop: 2,
    textAlign: 'right',
  },
  reciterCheck: {
    fontSize: 20,
    color: theme.colors.success,
    fontWeight: '700',
  },
  modalCloseBtn: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.success,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 13,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    color: '#fff',
    fontFamily: theme.typography.fontBodyBold,
    fontSize: 15,
  },
});
