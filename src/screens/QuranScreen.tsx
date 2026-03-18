import React, { useState, useCallback, useEffect } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SURAH_LIST, SurahMeta } from '../constants/surahList';
import { fetchSurah, SurahContent } from '../services/quran';
import { theme } from '../constants/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useSimpleMode } from '../contexts/SimpleModeContext';
import { MenuButton } from '../components/MenuButton';

type TranslationMode = 'english' | 'urdu' | 'both';

export function QuranScreen({ initialSurah }: { initialSurah?: number }) {
  const { language } = useLanguage();
  const { fs } = useSimpleMode();
  const isUrdu = language === 'ur';

  const [search, setSearch] = useState('');
  const [selectedSurah, setSelectedSurah] = useState<SurahMeta | null>(
    initialSurah ? (SURAH_LIST.find((s) => s.number === initialSurah) ?? null) : null
  );
  const [surahContent, setSurahContent] = useState<SurahContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [translationMode, setTranslationMode] = useState<TranslationMode>('urdu');

  const openSurah = useCallback(async (surah: SurahMeta) => {
    setSelectedSurah(surah);
    setSurahContent(null);
    setError(null);
    setLoading(true);
    try {
      const content = await fetchSurah(surah.number);
      setSurahContent(content);
    } catch {
      setError(isUrdu ? 'لوڈ نہیں ہو سکا۔ انٹرنیٹ چیک کریں۔' : 'Could not load. Check your internet connection.');
    } finally {
      setLoading(false);
    }
  }, [isUrdu]);

  // When mounted via deep-link (initialSurah prop), the surah meta is set
  // directly in useState but the fetch hasn't been triggered yet — do it now.
  useEffect(() => {
    if (initialSurah) {
      const surah = SURAH_LIST.find((s) => s.number === initialSurah);
      if (surah) openSurah(surah);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = SURAH_LIST.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.nameEnglish.toLowerCase().includes(q) ||
      s.nameArabic.includes(q) ||
      s.nameUrdu.includes(q) ||
      s.meaning.toLowerCase().includes(q) ||
      String(s.number).includes(q)
    );
  });

  /* ── Surah Reader View ── */
  if (selectedSurah) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(26, 122, 60, 0.08)', 'transparent']}
          style={styles.heroGradient}
          pointerEvents="none"
        />
        {/* Back + header */}
        <View style={styles.readerHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => { setSelectedSurah(null); setSurahContent(null); }}>
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

        {/* Translation toggle */}
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
          <ScrollView
            style={styles.ayahList}
            contentContainerStyle={styles.ayahListContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Bismillah (except Surah 9) */}
            {selectedSurah.number !== 9 && (
              <Text style={[styles.bismillah, { fontSize: fs(22) }]}>
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </Text>
            )}

            {surahContent.ayahs.map((ayah) => (
              <View key={ayah.numberInSurah} style={styles.ayahCard}>
                {/* Ayah number badge */}
                <View style={styles.ayahNumBadge}>
                  <Text style={styles.ayahNumText}>{ayah.numberInSurah}</Text>
                </View>

                {/* Arabic */}
                <Text style={[styles.ayahArabic, { fontSize: fs(20) }]}>{ayah.arabic}</Text>

                {/* Translation(s) */}
                {(translationMode === 'urdu' || translationMode === 'both') && (
                  <Text style={[styles.ayahUrdu, { fontSize: fs(14) }]}>{ayah.urdu}</Text>
                )}
                {(translationMode === 'english' || translationMode === 'both') && (
                  <Text style={[styles.ayahEnglish, { fontSize: fs(13) }]}>{ayah.english}</Text>
                )}
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    );
  }

  /* ── Surah Browser View ── */
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
              {isUrdu ? 'قرآن مجید' : 'Quran'}
            </Text>
            <Text style={[styles.browserSubtitle, { fontSize: fs(13) }]}>
              {isUrdu
                ? '۱۱۴ سورتیں — عربی + اردو + انگریزی ترجمہ'
                : '114 Surahs · Arabic + Urdu + English translation'}
            </Text>
          </View>
          <MenuButton />
        </View>
        {/* Search */}
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { fontSize: fs(14) }]}
            placeholder={isUrdu ? 'سورہ تلاش کریں...' : 'Search surah...'}
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
  // Browser
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
  surahInfo: {
    flex: 1,
  },
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
  // Reader
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
  toggleBtnActive: {
    backgroundColor: theme.colors.success,
  },
  toggleBtnText: {
    fontSize: 13,
    fontFamily: theme.typography.fontBodyMedium,
    color: theme.colors.textMuted,
  },
  toggleBtnTextActive: {
    color: '#fff',
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
  ayahList: {
    flex: 1,
  },
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
  ayahNumBadge: {
    alignSelf: 'flex-end',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
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
});
