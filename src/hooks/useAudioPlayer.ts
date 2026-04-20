import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import type { Ayah } from '../services/quran';

export type ReciterConfig = {
  id: string;
  nameEn: string;
  nameAr: string;
  nameUr: string;
  folder: string; // EveryAyah.com folder name
};


export const RECITERS: ReciterConfig[] = [
  {
    id: 'alafasy',
    nameEn: 'Mishary Alafasy',
    nameAr: 'مشاري العفاسي',
    nameUr: 'مشاری العفاسی',
    folder: 'Alafasy_128kbps',
  },
  {
    id: 'sudais',
    nameEn: 'Abdurrahman Al-Sudais',
    nameAr: 'عبدالرحمن السديس',
    nameUr: 'عبدالرحمن السدیس',
    folder: 'Sudais_192kbps',
  },
  {
    id: 'abdulbasit',
    nameEn: 'Abdul Basit (Murattal)',
    nameAr: 'عبد الباسط عبد الصمد',
    nameUr: 'عبدالباسط عبدالصمد',
    folder: 'Abdul_Basit_Murattal_192kbps',
  },
  {
    id: 'minshawi',
    nameEn: 'Minshawi (Murattal)',
    nameAr: 'محمد صديق المنشاوي',
    nameUr: 'محمد صدیق منشاوی',
    folder: 'Minshawi_Murattal_128kbps',
  },
];

// Translation audio reciters hosted on EveryAyah. Coverage is not 100% —
// on 404 we gracefully skip to the next step.
export const TRANSLATION_RECITERS = {
  urdu: {
    folder: 'Urdu_Shamshad_Ali_Khan_46kbps',
    nameEn: 'Shamshad Ali Khan',
    nameUr: 'شمشاد علی خان',
  },
  english: {
    folder: 'English_Ibrahim_Walk_128kbps',
    nameEn: 'Ibrahim Walk',
    nameUr: 'ابراہیم واک',
  },
} as const;

export type TranslationPlaybackMode = 'off' | 'urdu' | 'english' | 'both';
export type PlayingLang = 'arabic' | 'urdu' | 'english';

export type AudioPlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

function buildUrl(folder: string, surahNumber: number, ayahNumber: number): string {
  const s = String(surahNumber).padStart(3, '0');
  const a = String(ayahNumber).padStart(3, '0');
  return `https://everyayah.com/data/${folder}/${s}${a}.mp3`;
}

function buildStepList(mode: TranslationPlaybackMode): PlayingLang[] {
  const list: PlayingLang[] = ['arabic'];
  if (mode === 'urdu' || mode === 'both') list.push('urdu');
  if (mode === 'english' || mode === 'both') list.push('english');
  return list;
}

export function useAudioPlayer(
  surahNumber: number | null,
  ayahs: Ayah[],
  translationPlayback: TranslationPlaybackMode = 'off'
) {
  const soundRef = useRef<Audio.Sound | null>(null);
  // Refs let the onPlaybackStatusUpdate callback always read latest state
  // without being recreated on every render — avoids stale closures.
  const currentIndexRef = useRef<number | null>(null);
  const currentStepRef = useRef<number>(0);
  const ayahsRef = useRef<Ayah[]>(ayahs);
  const surahRef = useRef<number | null>(surahNumber);
  const reciterIdRef = useRef<string>('alafasy');
  const translationPlaybackRef = useRef<TranslationPlaybackMode>(translationPlayback);

  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [playingLang, setPlayingLang] = useState<PlayingLang>('arabic');
  const [pbStatus, setPbStatus] = useState<AudioPlaybackStatus>('idle');
  const [reciterId, setReciterId] = useState<string>('alafasy');

  useEffect(() => { ayahsRef.current = ayahs; }, [ayahs]);
  useEffect(() => { surahRef.current = surahNumber; }, [surahNumber]);
  useEffect(() => { reciterIdRef.current = reciterId; }, [reciterId]);
  useEffect(() => { translationPlaybackRef.current = translationPlayback; }, [translationPlayback]);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, [surahNumber]);

  const playStepAt = useCallback(async (index: number, step: number) => {
    const sNumber = surahRef.current;
    const theAyahs = ayahsRef.current;
    const reciter = RECITERS.find((r) => r.id === reciterIdRef.current) ?? RECITERS[0];

    if (!sNumber || index < 0 || index >= theAyahs.length) return;

    const steps = buildStepList(translationPlaybackRef.current);

    if (step >= steps.length) {
      const next = index + 1;
      if (next < theAyahs.length) {
        setTimeout(() => playStepAt(next, 0), 400);
      } else {
        setPbStatus('idle');
        setCurrentIndex(null);
        currentIndexRef.current = null;
      }
      return;
    }

    if (soundRef.current) {
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }

    setCurrentIndex(index);
    currentIndexRef.current = index;
    currentStepRef.current = step;
    const lang = steps[step];
    setPlayingLang(lang);
    setPbStatus('loading');

    try {
      // staysActiveInBackground keeps recitation playing when app is
      // backgrounded or screen is off. Requires UIBackgroundModes=audio on
      // iOS and WAKE_LOCK/FOREGROUND_SERVICE on Android (set in app.json).
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
    } catch { /* non-fatal */ }

    const ayah = theAyahs[index];
    const folder =
      lang === 'arabic'
        ? reciter.folder
        : lang === 'urdu'
        ? TRANSLATION_RECITERS.urdu.folder
        : TRANSLATION_RECITERS.english.folder;
    const url = buildUrl(folder, sNumber, ayah.numberInSurah);

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true },
        (status: AVPlaybackStatus) => {
          if (!status.isLoaded) {
            // Skip translation steps on load error (coverage gaps); Arabic
            // errors fall through to the outer catch and surface as real errors.
            return;
          }
          if (status.isPlaying) {
            setPbStatus('playing');
          } else if (status.didJustFinish) {
            const curIdx = currentIndexRef.current ?? index;
            const curStep = currentStepRef.current;
            setTimeout(() => playStepAt(curIdx, curStep + 1), 200);
          }
        }
      );
      soundRef.current = sound;
    } catch {
      // Translation file missing (common for some ayahs) — skip to next step.
      if (lang !== 'arabic') {
        setTimeout(() => playStepAt(index, step + 1), 100);
        return;
      }
      setPbStatus('error');
      setCurrentIndex(null);
      currentIndexRef.current = null;
    }
  }, []);

  const playAtIndex = useCallback((index: number) => {
    return playStepAt(index, 0);
  }, [playStepAt]);

  const togglePlayPause = useCallback(async () => {
    if (!soundRef.current) return;
    if (pbStatus === 'playing') {
      await soundRef.current.pauseAsync().catch(() => {});
      setPbStatus('paused');
    } else if (pbStatus === 'paused') {
      await soundRef.current.playAsync().catch(() => {});
      setPbStatus('playing');
    }
  }, [pbStatus]);

  const nextAyah = useCallback(() => {
    const next = (currentIndexRef.current ?? -1) + 1;
    if (next < ayahsRef.current.length) playAtIndex(next);
  }, [playAtIndex]);

  const prevAyah = useCallback(() => {
    const prev = (currentIndexRef.current ?? 1) - 1;
    if (prev >= 0) playAtIndex(prev);
  }, [playAtIndex]);

  const stop = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync().catch(() => {});
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
    setPbStatus('idle');
    setCurrentIndex(null);
    currentIndexRef.current = null;
    currentStepRef.current = 0;
    setPlayingLang('arabic');
  }, []);

  const changeReciter = useCallback(async (id: string) => {
    const wasPlayingIndex = currentIndexRef.current;
    await stop();
    setReciterId(id);
    reciterIdRef.current = id;
    if (wasPlayingIndex !== null) {
      setTimeout(() => playAtIndex(wasPlayingIndex), 100);
    }
  }, [stop, playAtIndex]);

  const currentReciter = RECITERS.find((r) => r.id === reciterId) ?? RECITERS[0];

  return {
    currentIndex,
    playingLang,
    pbStatus,
    reciterId,
    currentReciter,
    playAtIndex,
    togglePlayPause,
    nextAyah,
    prevAyah,
    stop,
    changeReciter,
  };
}
