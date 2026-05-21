import { useCallback, useEffect, useRef } from 'react';
import { useState } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';

// Mishary Rashid Alafasy reciting all 99 names back-to-back. Bundled as a
// local asset (3.8 MB, 128kbps mono) — earlier streaming attempts from
// archive.org repeatedly stalled on the user's mobile network, so we accept
// the APK size hit for guaranteed playback.
const LOCAL_SOURCE = require('../../assets/audio/asmaul-husna.mp3');

// Fallback per-name slice (s) until we know the true duration.
const FALLBACK_NAME_LENGTH_S = 2.02;

// Load-watchdog timeout. With a local asset this should never be needed,
// but kept as a safety net in case the bundled require somehow stalls.
const LOAD_TIMEOUT_MS = 10000;

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

// Async load helper — loads the bundled MP3 with a status callback wired
// up so the hook can react to playback progress + completion.
async function loadSound(
  onStatus: (s: AVPlaybackStatus) => void,
): Promise<Audio.Sound> {
  LOG('loading local asset');
  const { sound } = await Audio.Sound.createAsync(
    LOCAL_SOURCE,
    { shouldPlay: false, progressUpdateIntervalMillis: 250 },
    onStatus,
  );
  return sound;
}

export function useAsmaulHusnaAudio(): AsmaulHusnaAudio {
  const soundRef = useRef<Audio.Sound | null>(null);
  const durationMsRef = useRef<number>(0);

  const [state, setState] = useState<AudioState>('idle');
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const modeRef = useRef<Mode>('idle');
  // Auto-pause boundary for single-name playback (in ms).
  const stopAtMsRef = useRef<number | null>(null);
  const loadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Set audio mode once. Matches the Quran reader's setup exactly — that
  // hook plays expo-av audio reliably on the same devices that broke our
  // earlier Duck/InterruptionMode config.
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
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
    // No keep-alive resume here. We had one for the streaming version to
    // recover from buffer stalls, but with a bundled local asset every
    // isPlaying=false status is a real pause/finish — re-issuing playAsync
    // each time stuttered the audio (the user reported 'starts and
    // immediately stops, only the first name highlights').

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

  // Lazy-load + start playing. Idempotent — if the bundled asset is
  // already loaded, just plays. With a local require() this should never
  // realistically fail, but the load watchdog stays as a safety net.
  const ensureLoadedAndPlay = useCallback(
    async (seekMs: number | null) => {
      if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
      loadTimerRef.current = setTimeout(() => {
        if (modeRef.current !== 'idle') {
          LOG('load watchdog tripped');
          setState('error');
          modeRef.current = 'idle';
        }
      }, LOAD_TIMEOUT_MS);

      try {
        if (!soundRef.current) {
          const sound = await loadSound(onStatus);
          soundRef.current = sound;
        }
        if (seekMs != null && seekMs > 0) {
          await soundRef.current.setPositionAsync(seekMs);
        }
        await soundRef.current.playAsync();
        LOG('play started');
      } catch (e) {
        LOG('load/play threw:', String(e));
        setState('error');
        modeRef.current = 'idle';
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
