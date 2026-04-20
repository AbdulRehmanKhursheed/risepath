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

export type AudioPlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

function buildUrl(folder: string, surahNumber: number, ayahNumber: number): string {
  const s = String(surahNumber).padStart(3, '0');
  const a = String(ayahNumber).padStart(3, '0');
  return `https://everyayah.com/data/${folder}/${s}${a}.mp3`;
}

export function useAudioPlayer(surahNumber: number | null, ayahs: Ayah[]) {
  const soundRef = useRef<Audio.Sound | null>(null);
  // Refs let the onPlaybackStatusUpdate callback always read latest state
  // without being recreated on every render — avoids stale closures.
  const currentIndexRef = useRef<number | null>(null);
  const ayahsRef = useRef<Ayah[]>(ayahs);
  const surahRef = useRef<number | null>(surahNumber);
  const reciterIdRef = useRef<string>('alafasy');

  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [pbStatus, setPbStatus] = useState<AudioPlaybackStatus>('idle');
  const [reciterId, setReciterId] = useState<string>('alafasy');

  // Keep refs in sync with latest render values.
  useEffect(() => { ayahsRef.current = ayahs; }, [ayahs]);
  useEffect(() => { surahRef.current = surahNumber; }, [surahNumber]);
  useEffect(() => { reciterIdRef.current = reciterId; }, [reciterId]);

  // Unload audio when surah changes or component unmounts.
  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, [surahNumber]);

  // playAtIndex — stable ref-based function, called both externally and
  // recursively from the playback callback for auto-advance.
  const playAtIndex = useCallback(async (index: number) => {
    const sNumber = surahRef.current;
    const theAyahs = ayahsRef.current;
    const reciter = RECITERS.find((r) => r.id === reciterIdRef.current) ?? RECITERS[0];

    if (!sNumber || index < 0 || index >= theAyahs.length) return;

    // Unload previous before loading new.
    if (soundRef.current) {
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }

    setCurrentIndex(index);
    currentIndexRef.current = index;
    setPbStatus('loading');

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
    } catch { /* non-fatal */ }

    const ayah = theAyahs[index];
    const url = buildUrl(reciter.folder, sNumber, ayah.numberInSurah);

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true },
        (status: AVPlaybackStatus) => {
          if (!status.isLoaded) return;
          if (status.isPlaying) {
            setPbStatus('playing');
          } else if (status.didJustFinish) {
            const next = (currentIndexRef.current ?? index) + 1;
            if (next < ayahsRef.current.length) {
              // Short delay between ayahs feels more natural.
              setTimeout(() => playAtIndex(next), 400);
            } else {
              // End of surah.
              setPbStatus('idle');
              setCurrentIndex(null);
              currentIndexRef.current = null;
            }
          }
        }
      );
      soundRef.current = sound;
    } catch {
      setPbStatus('error');
      setCurrentIndex(null);
      currentIndexRef.current = null;
    }
  }, []); // stable — all state accessed via refs

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
  }, []);

  const changeReciter = useCallback(async (id: string) => {
    const wasPlayingIndex = currentIndexRef.current;
    await stop();
    setReciterId(id);
    reciterIdRef.current = id;
    // Resume at same ayah with new reciter if was playing.
    if (wasPlayingIndex !== null) {
      setTimeout(() => playAtIndex(wasPlayingIndex), 100);
    }
  }, [stop, playAtIndex]);

  const currentReciter = RECITERS.find((r) => r.id === reciterId) ?? RECITERS[0];

  return {
    currentIndex,
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
