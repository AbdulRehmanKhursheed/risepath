import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  AppState,
} from 'react-native';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../constants/theme';
import { PageVerse, QuranScript } from '../services/quran';
import { SURAH_LIST } from '../constants/surahList';
import { RECITERS } from '../hooks/useAudioPlayer';

type Lang = 'en' | 'ur' | 'ar';

const RECITER_KEY = 'quran_reciter_id_v1';
const DEFAULT_RECITER_FOLDER = RECITERS[0].folder;

// Resolve a reciter id to its everyayah folder via the single RECITERS source
// of truth — previously a divergent hardcoded map silently fell back to
// Alafasy for any reciter not in its (incomplete) list.
function folderForReciterId(id: string | null): string {
  if (!id) return DEFAULT_RECITER_FOLDER;
  return RECITERS.find((r) => r.id === id)?.folder ?? DEFAULT_RECITER_FOLDER;
}

function buildAyahUrl(folder: string, surah: number, ayah: number): string {
  const s = String(surah).padStart(3, '0');
  const a = String(ayah).padStart(3, '0');
  return `https://everyayah.com/data/${folder}/${s}${a}.mp3`;
}

export function AyahSheet({
  verse,
  onClose,
  language,
  translationMode,
  script = 'uthmani',
}: {
  verse: PageVerse | null;
  onClose: () => void;
  language: Lang;
  translationMode: 'english' | 'urdu' | 'both';
  script?: QuranScript;
}) {
  const isUrdu = language === 'ur';
  const isArabic = language === 'ar';
  const [folder, setFolder] = useState<string>(DEFAULT_RECITER_FOLDER);
  const [audioStatus, setAudioStatus] =
    useState<'idle' | 'loading' | 'playing' | 'paused' | 'error'>('idle');
  const soundRef = useRef<Audio.Sound | null>(null);

  // Refresh the reciter every time the sheet opens (not just on mount) — the
  // user may have changed it in the main reader between sheet opens.
  useEffect(() => {
    if (!verse) return;
    AsyncStorage.getItem(RECITER_KEY)
      .then((id) => setFolder(folderForReciterId(id)))
      .catch(() => {});
  }, [verse?.verseKey]);

  // Unload any sound when the sheet closes or the selected verse changes.
  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
      soundRef.current = null;
    };
  }, [verse?.verseKey]);

  // Stop audio + dismiss the sheet when the app is backgrounded — without
  // this, audio keeps playing under the lock screen and the sheet stays open
  // on resume.
  useEffect(() => {
    if (!verse) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        soundRef.current?.stopAsync().catch(() => {});
        soundRef.current?.unloadAsync().catch(() => {});
        soundRef.current = null;
        setAudioStatus('idle');
        onClose();
      }
    });
    return () => sub.remove();
  }, [verse?.verseKey, onClose]);

  const playAyah = async () => {
    if (!verse) return;
    try {
      setAudioStatus('loading');
      await soundRef.current?.unloadAsync().catch(() => {});
      soundRef.current = null;

      // Must match the surah player's global mode — this call is app-wide,
      // and flipping staysActiveInBackground off here used to kill background
      // playback for the main reader until the next launch. The sheet's own
      // audio still stops on background via the AppState listener above.
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: buildAyahUrl(folder, verse.surahNumber, verse.ayahNumber) },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      setAudioStatus('playing');
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        if (status.didJustFinish) {
          setAudioStatus('idle');
          sound.unloadAsync().catch(() => {});
          soundRef.current = null;
        }
      });
    } catch {
      soundRef.current = null;
      setAudioStatus('error');
    }
  };

  // Real pause/resume — the old "Pause" stopped and discarded the sound, so
  // resuming restarted the ayah from the beginning.
  const togglePause = async () => {
    const sound = soundRef.current;
    if (!sound) return;
    try {
      if (audioStatus === 'playing') {
        await sound.pauseAsync();
        setAudioStatus('paused');
      } else if (audioStatus === 'paused') {
        await sound.playAsync();
        setAudioStatus('playing');
      }
    } catch {
      setAudioStatus('error');
    }
  };

  const stopAyah = async () => {
    try {
      await soundRef.current?.stopAsync().catch(() => {});
      await soundRef.current?.unloadAsync().catch(() => {});
    } catch {}
    soundRef.current = null;
    setAudioStatus('idle');
  };

  const closeSheet = async () => {
    await stopAyah();
    onClose();
  };

  const showEn =
    translationMode === 'english' || translationMode === 'both';
  const showUr =
    translationMode === 'urdu' || translationMode === 'both';

  const surahMeta = verse ? SURAH_LIST.find((s) => s.number === verse.surahNumber) : null;
  const surahName = surahMeta
    ? isUrdu
      ? surahMeta.nameUrdu
      : surahMeta.nameEnglish
    : '';

  return (
    <Modal
      visible={verse !== null}
      transparent
      animationType="slide"
      onRequestClose={closeSheet}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.overlayDismiss}
          activeOpacity={1}
          onPress={closeSheet}
        />
        <View style={styles.sheet}>
          {verse && (
            <>
              <View style={styles.handle} />
              <View style={styles.header}>
                <Text style={styles.surahName}>{surahName}</Text>
                <Text style={styles.verseRef}>
                  {isUrdu
                    ? `آیت ${verse.ayahNumber}`
                    : `Ayah ${verse.ayahNumber}`}
                  {'  ·  '}
                  {verse.verseKey}
                </Text>
              </View>

              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                <Text
                  style={[
                    styles.arabic,
                    {
                      fontFamily:
                        script === 'indopak'
                          ? theme.typography.fontQuranIndopak
                          : theme.typography.fontQuranUthmani,
                    },
                  ]}
                >
                  {script === 'indopak' && verse.textIndopak ? verse.textIndopak : verse.textUthmani}
                </Text>

                {showUr && (
                  <View style={styles.transBlock}>
                    <Text style={styles.transLabel}>
                      {isUrdu ? 'اردو ترجمہ' : 'Urdu'}
                    </Text>
                    <Text style={styles.transUrdu}>
                      {verse.translationUr || (isUrdu ? 'ترجمہ دستیاب نہیں' : 'Translation unavailable')}
                    </Text>
                  </View>
                )}

                {showEn && (
                  <View style={styles.transBlock}>
                    <Text style={styles.transLabel}>
                      {isUrdu ? 'انگریزی ترجمہ' : 'English'}
                    </Text>
                    <Text style={styles.transEnglish}>
                      {verse.translationEn || 'Translation unavailable'}
                    </Text>
                  </View>
                )}
              </ScrollView>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.playBtn]}
                  onPress={
                    audioStatus === 'playing' || audioStatus === 'paused'
                      ? togglePause
                      : playAyah
                  }
                  disabled={audioStatus === 'loading'}
                  activeOpacity={0.85}
                >
                  {audioStatus === 'loading' ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.playBtnText}>
                      {audioStatus === 'playing'
                        ? isUrdu ? '⏸  وقفہ' : '⏸  Pause'
                        : audioStatus === 'paused'
                        ? isUrdu ? '▶  جاری رکھیں' : '▶  Resume'
                        : audioStatus === 'error'
                        ? isUrdu ? '↻  دوبارہ کوشش' : '↻  Retry'
                        : isUrdu ? '▶  سنیں' : '▶  Play Ayah'}
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.closeBtn]}
                  onPress={closeSheet}
                  activeOpacity={0.85}
                >
                  <Text style={styles.closeBtnText}>
                    {isUrdu ? 'بند کریں' : isArabic ? 'إغلاق' : 'Close'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(28, 15, 6, 0.55)',
  },
  overlayDismiss: { flex: 1 },
  sheet: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '78%',
    paddingBottom: 28,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.colors.border,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  header: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSoft,
  },
  surahName: {
    fontSize: 19,
    color: theme.colors.text,
    fontFamily: theme.typography.fontHeadingBold,
  },
  verseRef: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBodyMedium,
    marginTop: 3,
    letterSpacing: 0.4,
  },
  scroll: {
    maxHeight: 420,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  arabic: {
    fontSize: 26,
    color: theme.colors.text,
    fontFamily: theme.typography.fontQuranUthmani,
    textAlign: 'right',
    lineHeight: 52,
    writingDirection: 'rtl',
  },
  transBlock: {
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSoft,
  },
  transLabel: {
    fontSize: 11,
    color: theme.colors.accent,
    fontFamily: theme.typography.fontBodyBold,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 6,
  },
  transUrdu: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontBody,
    lineHeight: 28,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  transEnglish: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontBody,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  playBtn: {
    backgroundColor: theme.colors.accent,
  },
  playBtnText: {
    fontSize: 15,
    color: '#fff',
    fontFamily: theme.typography.fontBodyBold,
  },
  closeBtn: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  closeBtnText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontBodyBold,
  },
});
