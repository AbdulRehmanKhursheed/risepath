import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import type { Ayah } from '../services/quran';

export type ReciterConfig = {
  id: string;
  nameEn: string;
  nameAr: string;
  nameUr: string;
  folder: string;
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
    folder: 'Abdurrahmaan_As-Sudais_192kbps',
  },
  {
    id: 'shuraim',
    nameEn: 'Saud Al-Shuraim',
    nameAr: 'سعود الشريم',
    nameUr: 'سعود الشریم',
    folder: 'Saood_ash-Shuraym_128kbps',
  },
  {
    id: 'maher',
    nameEn: 'Maher Al-Muaiqly',
    nameAr: 'ماهر المعيقلي',
    nameUr: 'ماہر المعیقلی',
    folder: 'MaherAlMuaiqly128kbps',
  },
  {
    id: 'ghamidi',
    nameEn: 'Saad Al-Ghamidi',
    nameAr: 'سعد الغامدي',
    nameUr: 'سعد الغامدی',
    folder: 'Ghamadi_40kbps',
  },
  {
    id: 'abdulbasit',
    nameEn: 'Abdul Basit (Murattal)',
    nameAr: 'عبد الباسط عبد الصمد',
    nameUr: 'عبدالباسط عبدالصمد',
    folder: 'Abdul_Basit_Murattal_192kbps',
  },
  {
    id: 'husary',
    nameEn: 'Mahmoud Al-Husary',
    nameAr: 'محمود خليل الحصري',
    nameUr: 'محمود الحصری',
    folder: 'Husary_128kbps',
  },
  {
    id: 'minshawi',
    nameEn: 'Minshawy (Murattal)',
    nameAr: 'محمد صديق المنشاوي',
    nameUr: 'محمد صدیق منشاوی',
    folder: 'Minshawy_Murattal_128kbps',
  },
  {
    id: 'hanirifai',
    nameEn: 'Hani Ar-Rifai',
    nameAr: 'هاني الرفاعي',
    nameUr: 'ہانی الرفاعی',
    folder: 'Hani_Rifai_192kbps',
  },
  {
    id: 'shatri',
    nameEn: 'Abu Bakr Al-Shatri',
    nameAr: 'أبو بكر الشاطري',
    nameUr: 'ابو بکر الشاطری',
    folder: 'Abu_Bakr_Ash-Shaatree_128kbps',
  },
  {
    id: 'ajmi',
    nameEn: 'Ahmed Al-Ajmi',
    nameAr: 'أحمد بن علي العجمي',
    nameUr: 'احمد العجمی',
    folder: 'Ahmed_ibn_Ali_al-Ajamy_128kbps',
  },
  {
    id: 'juhany',
    nameEn: 'Abdullah Al-Juhany',
    nameAr: 'عبدالله عواد الجهني',
    nameUr: 'عبداللہ الجہنی',
    folder: 'Abdullaah_3awwaad_Al-Juhaynee_128kbps',
  },
  {
    id: 'dossari',
    nameEn: 'Yasser Al-Dossari',
    nameAr: 'ياسر الدوسري',
    nameUr: 'یاسر الدوسری',
    folder: 'Yasser_Ad-Dussary_128kbps',
  },
  {
    id: 'jibreel',
    nameEn: 'Muhammad Jibreel',
    nameAr: 'محمد جبريل',
    nameUr: 'محمد جبریل',
    folder: 'Muhammad_Jibreel_128kbps',
  },
  {
    id: 'ayyoub',
    nameEn: 'Muhammad Ayyoub',
    nameAr: 'محمد أيوب',
    nameUr: 'محمد ایوب',
    folder: 'Muhammad_Ayyoub_128kbps',
  },
  {
    id: 'qahtani',
    nameEn: 'Khalid Al-Qahtani',
    nameAr: 'خالد القحطاني',
    nameUr: 'خالد القحطانی',
    folder: 'Khaalid_Abdullaah_al-Qahtaanee_192kbps',
  },
  {
    id: 'bukhatir',
    nameEn: 'Salah Bukhatir',
    nameAr: 'صلاح بوخاطر',
    nameUr: 'صلاح بوخاطر',
    folder: 'Salaah_AbdulRahman_Bukhatir_128kbps',
  },
];

export const TRANSLATION_RECITERS = {
  urdu: {
    folder: 'translations/urdu_shamshad_ali_khan_46kbps',
    nameEn: 'Shamshad Ali Khan',
    nameUr: 'شمشاد علی خان',
  },
  english: {
    folder: 'English/Sahih_Intnl_Ibrahim_Walk_192kbps',
    nameEn: 'Sahih Intl · Ibrahim Walk',
    nameUr: 'ابراہیم واک',
  },
} as const;

export type TranslationPlaybackMode = 'off' | 'urdu' | 'english' | 'both';
export type PlayingLang = 'arabic' | 'urdu' | 'english';
export type AudioPlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

type Segment = { index: number; step: number };

const RECITER_SWITCH_DELAY_MS = 60;
const AUTO_REVERT_DELAY_MS = 80;

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

function segEq(a: Segment | null, b: Segment | null): boolean {
  return !!a && !!b && a.index === b.index && a.step === b.step;
}

export function useAudioPlayer(
  surahNumber: number | null,
  ayahs: Ayah[],
  translationPlayback: TranslationPlaybackMode = 'off'
) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const preloadRef = useRef<{ sound: Audio.Sound; seg: Segment } | null>(null);

  const segRef = useRef<Segment | null>(null);
  const ayahsRef = useRef<Ayah[]>(ayahs);
  const surahRef = useRef<number | null>(surahNumber);
  const reciterIdRef = useRef<string>('alafasy');
  const translationPlaybackRef = useRef<TranslationPlaybackMode>(translationPlayback);
  const lastGoodReciterRef = useRef<string>('alafasy');

  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [playingLang, setPlayingLang] = useState<PlayingLang>('arabic');
  const [pbStatus, setPbStatus] = useState<AudioPlaybackStatus>('idle');
  const [reciterId, setReciterId] = useState<string>('alafasy');

  useEffect(() => { ayahsRef.current = ayahs; }, [ayahs]);
  useEffect(() => { surahRef.current = surahNumber; }, [surahNumber]);
  useEffect(() => { reciterIdRef.current = reciterId; }, [reciterId]);
  useEffect(() => { translationPlaybackRef.current = translationPlayback; }, [translationPlayback]);

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    }).catch(() => {});
  }, []);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
      soundRef.current = null;
      preloadRef.current?.sound.unloadAsync().catch(() => {});
      preloadRef.current = null;
    };
  }, [surahNumber]);

  useEffect(() => {
    preloadRef.current?.sound.unloadAsync().catch(() => {});
    preloadRef.current = null;
  }, [reciterId, translationPlayback]);

  const segToUrl = useCallback((seg: Segment): string | null => {
    const sNumber = surahRef.current;
    const theAyahs = ayahsRef.current;
    if (!sNumber || seg.index < 0 || seg.index >= theAyahs.length) return null;
    const steps = buildStepList(translationPlaybackRef.current);
    if (seg.step < 0 || seg.step >= steps.length) return null;
    const lang = steps[seg.step];
    const reciter = RECITERS.find((r) => r.id === reciterIdRef.current) ?? RECITERS[0];
    const folder =
      lang === 'arabic'
        ? reciter.folder
        : lang === 'urdu'
        ? TRANSLATION_RECITERS.urdu.folder
        : TRANSLATION_RECITERS.english.folder;
    return buildUrl(folder, sNumber, theAyahs[seg.index].numberInSurah);
  }, []);

  const nextSeg = useCallback((seg: Segment): Segment | null => {
    const steps = buildStepList(translationPlaybackRef.current);
    if (seg.step + 1 < steps.length) return { index: seg.index, step: seg.step + 1 };
    if (seg.index + 1 < ayahsRef.current.length) return { index: seg.index + 1, step: 0 };
    return null;
  }, []);

  const preloadSeg = useCallback(async (seg: Segment) => {
    if (segEq(preloadRef.current?.seg ?? null, seg)) return;
    if (preloadRef.current) {
      const old = preloadRef.current;
      preloadRef.current = null;
      old.sound.unloadAsync().catch(() => {});
    }
    const url = segToUrl(seg);
    if (!url) return;
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: false });
      if (preloadRef.current) {
        sound.unloadAsync().catch(() => {});
        return;
      }
      preloadRef.current = { sound, seg };
    } catch {
      // Slow path will surface any real error when the user hits this segment.
    }
  }, [segToUrl]);

  const playSegRef = useRef<((seg: Segment) => Promise<void>) | null>(null);

  const playSeg = useCallback(async (seg: Segment) => {
    const sNumber = surahRef.current;
    const theAyahs = ayahsRef.current;
    if (!sNumber || seg.index < 0 || seg.index >= theAyahs.length) return;

    const steps = buildStepList(translationPlaybackRef.current);
    if (seg.step >= steps.length) return;

    const lang = steps[seg.step];
    segRef.current = seg;
    setCurrentIndex(seg.index);
    setPlayingLang(lang);

    const onStatus = (status: AVPlaybackStatus) => {
      if (!status.isLoaded) return;
      if (status.isPlaying) {
        setPbStatus('playing');
        if (lang === 'arabic') {
          lastGoodReciterRef.current = reciterIdRef.current;
        }
        const n = nextSeg(seg);
        if (n) preloadSeg(n);
      } else if (status.didJustFinish) {
        const n = nextSeg(seg);
        if (!n) {
          soundRef.current?.unloadAsync().catch(() => {});
          soundRef.current = null;
          preloadRef.current?.sound.unloadAsync().catch(() => {});
          preloadRef.current = null;
          setPbStatus('idle');
          setCurrentIndex(null);
          segRef.current = null;
          return;
        }
        // Play the next segment immediately — NOT via setTimeout. If the JS
        // thread is idle for even 50ms between clips while the device is
        // locked, iOS/Android suspend the app and our timer never fires.
        // The natural trailing silence of each mp3 already provides a
        // perceptible breath between ayahs.
        playSegRef.current?.(n);
      }
    };

    if (preloadRef.current && segEq(preloadRef.current.seg, seg)) {
      const pre = preloadRef.current;
      preloadRef.current = null;
      const oldSound = soundRef.current;
      soundRef.current = pre.sound;
      if (oldSound) oldSound.unloadAsync().catch(() => {});
      try {
        pre.sound.setOnPlaybackStatusUpdate(onStatus);
        await pre.sound.playAsync();
        return;
      } catch {
        soundRef.current = null;
        pre.sound.unloadAsync().catch(() => {});
      }
    }

    setPbStatus('loading');
    const oldSound = soundRef.current;
    soundRef.current = null;
    if (oldSound) oldSound.unloadAsync().catch(() => {});

    const url = segToUrl(seg);
    if (!url) return;
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true },
        onStatus
      );
      soundRef.current = sound;
    } catch {
      if (lang !== 'arabic') {
        const n = nextSeg(seg);
        if (n) setTimeout(() => { playSegRef.current?.(n); }, AUTO_REVERT_DELAY_MS);
        else {
          setPbStatus('idle');
          setCurrentIndex(null);
          segRef.current = null;
        }
        return;
      }
      // Auto-revert: a dead-end error with no way back is worse than silently
      // falling back to the reciter the user was already happily listening to.
      if (reciterIdRef.current !== lastGoodReciterRef.current) {
        const fallback = lastGoodReciterRef.current;
        setReciterId(fallback);
        reciterIdRef.current = fallback;
        setTimeout(() => { playSegRef.current?.(seg); }, AUTO_REVERT_DELAY_MS);
        return;
      }
      setPbStatus('error');
    }
  }, [nextSeg, preloadSeg, segToUrl]);

  useEffect(() => { playSegRef.current = playSeg; }, [playSeg]);

  const playAtIndex = useCallback((index: number) => {
    preloadRef.current?.sound.unloadAsync().catch(() => {});
    preloadRef.current = null;
    return playSeg({ index, step: 0 });
  }, [playSeg]);

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
    const cur = segRef.current;
    const base = cur ? cur.index : -1;
    if (base + 1 < ayahsRef.current.length) playAtIndex(base + 1);
  }, [playAtIndex]);

  const prevAyah = useCallback(() => {
    const cur = segRef.current;
    const base = cur ? cur.index : 1;
    if (base - 1 >= 0) playAtIndex(base - 1);
  }, [playAtIndex]);

  const stop = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync().catch(() => {});
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
    if (preloadRef.current) {
      preloadRef.current.sound.unloadAsync().catch(() => {});
      preloadRef.current = null;
    }
    setPbStatus('idle');
    setCurrentIndex(null);
    segRef.current = null;
    setPlayingLang('arabic');
  }, []);

  const retry = useCallback(() => {
    const cur = segRef.current;
    if (cur) playSeg({ index: cur.index, step: 0 });
  }, [playSeg]);

  const changeReciter = useCallback(async (id: string) => {
    const cur = segRef.current;
    setReciterId(id);
    reciterIdRef.current = id;
    preloadRef.current?.sound.unloadAsync().catch(() => {});
    preloadRef.current = null;
    if (cur) {
      if (soundRef.current) {
        const old = soundRef.current;
        soundRef.current = null;
        old.stopAsync().catch(() => {});
        old.unloadAsync().catch(() => {});
      }
      setTimeout(() => {
        playSegRef.current?.({ index: cur.index, step: 0 });
      }, RECITER_SWITCH_DELAY_MS);
    }
  }, []);

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
    retry,
    changeReciter,
  };
}
