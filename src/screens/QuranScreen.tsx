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
import { SURAH_LIST, SurahMeta } from '../constants/surahList';
import { fetchSurah, SurahContent, Ayah } from '../services/quran';
import { theme } from '../constants/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useSimpleMode } from '../contexts/SimpleModeContext';
import { MenuButton } from '../components/MenuButton';
import { useAudioPlayer, RECITERS, TranslationPlaybackMode } from '../hooks/useAudioPlayer';
import { prefetchAdjacent } from '../services/quran';
import { matchesSurah } from '../utils/surahSearch';

type TranslationMode = 'english' | 'urdu' | 'both';

export function QuranScreen({ initialSurah }: { initialSurah?: number }) {
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
  const [translationAudioEnabled, setTranslationAudioEnabled] = useState(false);

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

  const openSurah = useCallback(async (surah: SurahMeta) => {
    await stop();
    setSelectedSurah(surah);
    setSurahContent(null);
    setError(null);
    setLoading(true);
    ayahYRef.current = {};
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
    if (!selectedSurah) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      (async () => {
        await stop();
        setSelectedSurah(null);
        setSurahContent(null);
      })();
      return true;
    });
    return () => sub.remove();
  }, [selectedSurah, stop]);

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
          <View style={styles.readerTitleWrap}>
            <Text style={styles.readerArabicTitle}>{selectedSurah.nameArabic}</Text>
            <Text style={styles.readerEnglishTitle}>
              {isUrdu ? selectedSurah.nameUrdu : selectedSurah.nameEnglish}
              {'  ·  '}{selectedSurah.ayahs} {isUrdu ? 'آیات' : 'ayahs'}
            </Text>
          </View>
        </View>

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
            <ScrollView
              ref={scrollRef}
              style={styles.ayahList}
              contentContainerStyle={[
                styles.ayahListContent,
                { paddingBottom: isPlayerActive ? 112 : theme.spacing.xxxl },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {/* Bismillah omitted for Surah 9 (At-Tawbah) by convention. */}
              {selectedSurah.number !== 9 && (
                <Text style={[styles.bismillah, { fontSize: fs(22) }]}>
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </Text>
              )}

              {surahContent.ayahs.map((ayah, idx) => {
                const isPlaying = playingIndex === idx;
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

                    <Text style={[styles.ayahArabic, { fontSize: fs(20) }]}>{ayah.arabic}</Text>

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

            {isPlayerActive && surahContent && (
              <View style={styles.playerBar}>
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
          onRequestClose={() => setReciterPickerOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={[styles.modalTitle, { fontSize: fs(17) }]}>
                {isUrdu ? 'قاری منتخب کریں' : isArabic ? 'اختر القارئ' : 'Choose Reciter'}
              </Text>
              {RECITERS.map((r) => {
                const selected = r.id === currentReciter.id;
                return (
                  <TouchableOpacity
                    key={r.id}
                    style={[styles.reciterOption, selected && styles.reciterOptionSelected]}
                    onPress={() => { changeReciter(r.id); setReciterPickerOpen(false); }}
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
              })}
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setReciterPickerOpen(false)}
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
            placeholder={isUrdu ? 'سورہ تلاش کریں...' : isArabic ? 'ابحث عن سورة...' : 'Search surah...'}
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
    fontFamily: theme.typography.fontBody,
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
  readerTitleWrap: {
    flex: 1,
    alignItems: 'flex-end',
  },
  readerArabicTitle: {
    fontSize: 22,
    color: theme.colors.text,
    fontFamily: theme.typography.fontBody,
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
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 10,
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
    gap: theme.spacing.md,
  },
  playerBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerBtnIcon: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.85)',
  },
  playerPlayPauseBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#1A7A3C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 6 },
      android: { elevation: 4 },
    }),
  },
  playerPlayPauseIcon: {
    fontSize: 17,
    color: '#FFFFFF',
  },
  playerStopBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  playerStopIcon: {
    fontSize: 13,
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
