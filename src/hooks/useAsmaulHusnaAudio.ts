import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio, AVPlaybackStatus, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

// Mishary Rashid Alafasy reciting all 99 names back-to-back.
// We try a list of URLs in order — the resolved archive.org mirror first
// (no redirect), with the canonical /download/ URL as a fallback.
const SOURCE_URIS = [
  'https://ia801407.us.archive.org/5/items/asmaul-husna-mishary/Asmaul_Husna_Mishary.mp3',
  'https://archive.org/download/asmaul-husna-mishary/Asmaul_Husna_Mishary.mp3',
];

// Fallback per-name slice (s) until we know the true duration.
const FALLBACK_NAME_LENGTH_S = 2.02;

// If loading hasn't completed within this many ms, try the next source URL,
// and if that also fails surface an error state to the UI.
const LOAD_TIMEOUT_MS = 20000;

// Set to true to re-enable verbose debug logging.
const DEBUG_LOG = false;
const LOG = (...args: unknown[]) => { if (DEBUG_LOG) console.log('[asma-audio]', ...args); };

export type AudioState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

type Mode = 'idle' | 'one' | 'all';

export type AsmaulHusnaAudio = {
  state: AudioState;
  currentNumber: number | null;
  isPlayAll: boolean;
  play: (number: number) => void;
  playAll: (startFrom?: number) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
};

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

// Async load helper — creates an Audio.Sound from a URL with a status
// callback wired up so we can react to playback progress + completion.
async function loadSound(
  uri: string,
  onStatus: (s: AVPlaybackStatus) => void,
): Promise<Audio.Sound> {
  LOG('loading', uri);
  const { sound } = await Audio.Sound.createAsync(
    { uri },
    { shouldPlay: false, progressUpdateIntervalMillis: 250 },
    onStatus,
    /* downloadFirst */ false,
  );
  return sound;
}

export function useAsmaulHusnaAudio(): AsmaulHusnaAudio {
  const soundRef = useRef<Audio.Sound | null>(null);
  const durationMsRef = useRef<number>(0);
  // Active source index — incremented when a load fails, so the next load
  // attempt picks up the fallback URL.
  const sourceIdxRef = useRef<number>(0);

  const [state, setState] = useState<AudioState>('idle');
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const modeRef = useRef<Mode>('idle');
  // Auto-pause boundary for single-name playback (in ms).
  const stopAtMsRef = useRef<number | null>(null);
  const loadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Set audio mode once.
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
      interruptionModeIOS: InterruptionModeIOS.DuckOthers,
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
    })
      .then(() => LOG('audio mode set OK'))
      .catch((e) => LOG('audio mode error:', String(e)));
    return () => {
      if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
      soundRef.current?.unloadAsync().catch(() => {});
      soundRef.current = null;
    };
  }, []);

  const nameLengthMs =
    durationMsRef.current > 0 ? durationMsRef.current / 99 : FALLBACK_NAME_LENGTH_S * 1000;

  // Single status handler shared across loads. Runs in the native callback
  // thread; keep it cheap and don't synchronously do heavy work.
  const onStatus = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) LOG('status error:', status.error);
      return;
    }
    if (durationMsRef.current === 0 && status.durationMillis) {
      durationMsRef.current = status.durationMillis;
      LOG('duration learned:', status.durationMillis, 'ms');
    }

    if (status.isPlaying) {
      if (state !== 'playing') {
        LOG('→ playing');
        setState('playing');
      }
      if (loadTimerRef.current) {
        clearTimeout(loadTimerRef.current);
        loadTimerRef.current = null;
      }
    }

    const tMs = status.positionMillis ?? 0;

    if (modeRef.current === 'one' && stopAtMsRef.current != null) {
      if (tMs >= stopAtMsRef.current) {
        soundRef.current?.pauseAsync().catch(() => {});
        stopAtMsRef.current = null;
        modeRef.current = 'idle';
        setState('idle');
      }
    } else if (modeRef.current === 'all') {
      const idx = clamp(Math.floor(tMs / nameLengthMs) + 1, 1, 99);
      setCurrentNumber((prev) => (prev === idx ? prev : idx));
      if (status.didJustFinish) {
        modeRef.current = 'idle';
        setState('idle');
        setCurrentNumber(null);
      }
    }
  }, [state, nameLengthMs]);

  // Lazy-load + start playing. Idempotent — if already loaded, just plays.
  // Handles the source-fallback chain on load failure.
  const ensureLoadedAndPlay = useCallback(
    async (seekMs: number | null) => {
      if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
      loadTimerRef.current = setTimeout(async () => {
        // Load timeout: unload, try the next source.
        if (sourceIdxRef.current < SOURCE_URIS.length - 1) {
          sourceIdxRef.current += 1;
          LOG('load timeout, falling back to source idx', sourceIdxRef.current);
          await soundRef.current?.unloadAsync().catch(() => {});
          soundRef.current = null;
          if (modeRef.current !== 'idle') {
            ensureLoadedAndPlay(seekMs).catch(() => {});
          }
        } else {
          LOG('all sources exhausted');
          setState('error');
          modeRef.current = 'idle';
        }
      }, LOAD_TIMEOUT_MS);

      try {
        if (!soundRef.current) {
          const sound = await loadSound(SOURCE_URIS[sourceIdxRef.current], onStatus);
          soundRef.current = sound;
        }
        if (seekMs != null && seekMs > 0) {
          await soundRef.current.setPositionAsync(seekMs);
        }
        await soundRef.current.playAsync();
        LOG('play started');
      } catch (e) {
        LOG('load/play threw:', String(e));
        // Try fallback on exception too.
        if (sourceIdxRef.current < SOURCE_URIS.length - 1) {
          sourceIdxRef.current += 1;
          await soundRef.current?.unloadAsync().catch(() => {});
          soundRef.current = null;
          if (modeRef.current !== 'idle') {
            ensureLoadedAndPlay(seekMs).catch(() => {});
          }
        } else {
          setState('error');
          modeRef.current = 'idle';
        }
      }
    },
    [onStatus],
  );

  const play = useCallback(
    (number: number) => {
      const n = clamp(number, 1, 99);
      const offsetMs = (n - 1) * nameLengthMs;
      LOG('play() name=', n, 'offsetMs=', offsetMs);
      modeRef.current = 'one';
      stopAtMsRef.current = n * nameLengthMs;
      setCurrentNumber(n);
      setState('loading');
      ensureLoadedAndPlay(offsetMs).catch(() => {});
    },
    [nameLengthMs, ensureLoadedAndPlay],
  );

  const playAll = useCallback(
    (startFrom: number = 1) => {
      const n = clamp(startFrom, 1, 99);
      LOG('playAll() startFrom=', n);
      modeRef.current = 'all';
      stopAtMsRef.current = null;
      setCurrentNumber(n);
      setState('loading');
      const seekMs = n > 1 ? (n - 1) * nameLengthMs : null;
      ensureLoadedAndPlay(seekMs).catch(() => {});
    },
    [nameLengthMs, ensureLoadedAndPlay],
  );

  const pause = useCallback(() => {
    soundRef.current?.pauseAsync().catch(() => {});
    setState('paused');
  }, []);

  const resume = useCallback(() => {
    soundRef.current?.playAsync().catch(() => {});
    setState('playing');
  }, []);

  const stop = useCallback(() => {
    soundRef.current?.pauseAsync().catch(() => {});
    modeRef.current = 'idle';
    stopAtMsRef.current = null;
    if (loadTimerRef.current) {
      clearTimeout(loadTimerRef.current);
      loadTimerRef.current = null;
    }
    setCurrentNumber(null);
    setState('idle');
  }, []);

  return {
    state,
    currentNumber,
    isPlayAll: modeRef.current === 'all',
    play,
    playAll,
    pause,
    resume,
    stop,
  };
}
