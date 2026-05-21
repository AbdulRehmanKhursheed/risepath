import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AudioModule,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';

// Mishary Rashid Alafasy reciting all 99 names back-to-back.
// We try a list of URLs in order — archive.org's canonical /download/ URL
// (302 redirects to whichever mirror is closest) plus a few stable mirror
// fallbacks for clients that don't follow redirects gracefully.
const SOURCE_URIS = [
  'https://ia801407.us.archive.org/5/items/asmaul-husna-mishary/Asmaul_Husna_Mishary.mp3',
  'https://archive.org/download/asmaul-husna-mishary/Asmaul_Husna_Mishary.mp3',
];

// Lightweight verbose logging so the user can see in Metro what's
// happening when the audio doesn't behave. Tagged so it's easy to grep.
const LOG = (...args: unknown[]) => console.log('[asma-audio]', ...args);

// Fallback per-name slice length until the player reports its true duration.
// File is ~200s for 99 names → ~2.02s per name.
const FALLBACK_NAME_LENGTH_S = 2.02;

// If the player doesn't reach isLoaded within this window after a play
// request, surface an error instead of a loading state forever.
const LOAD_TIMEOUT_MS = 15000;

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

export function useAsmaulHusnaAudio(): AsmaulHusnaAudio {
  const [sourceIdx, setSourceIdx] = useState(0);
  const player = useAudioPlayer(SOURCE_URIS[sourceIdx]);
  const status = useAudioPlayerStatus(player);

  const [state, setState] = useState<AudioState>('idle');
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const modeRef = useRef<Mode>('idle');
  // Seconds at which to auto-pause single-name playback (otherwise we'd
  // bleed into the next name).
  const stopAtRef = useRef<number | null>(null);
  // Offset we want to seek to as soon as the player reports isLoaded.
  // Set imperatively on play()/playAll(); cleared after the seek completes.
  const pendingSeekRef = useRef<number | null>(null);
  // Timer that flips us to 'error' if load never completes.
  const loadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Background audio mode + iOS silent-mode override, set once.
  useEffect(() => {
    LOG('init: setting audio mode, source =', SOURCE_URIS[sourceIdx]);
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'duckOthers',
    }).then(() => LOG('audio mode set OK')).catch((e) => LOG('audio mode error:', String(e)));
    return () => {
      try { player.pause(); } catch {}
      if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
    };
  }, [player, sourceIdx]);

  const nameLength =
    status.duration && status.duration > 0
      ? status.duration / 99
      : FALLBACK_NAME_LENGTH_S;

  // React to playback progress. Three responsibilities:
  //   1. Apply a deferred seek as soon as the player reports isLoaded.
  //   2. Map raw status flags onto our coarser state machine.
  //   3. Auto-pause single-name play at the next-name boundary,
  //      and track current-name index during play-all.
  useEffect(() => {
    if (status.isLoaded && state === 'loading') {
      LOG('status: isLoaded=true, duration=', status.duration, 'playing=', status.playing);
    }

    // (1) Apply a deferred seek once the audio is actually loaded.
    if (status.isLoaded && pendingSeekRef.current != null) {
      const target = pendingSeekRef.current;
      LOG('applying deferred seek to', target);
      pendingSeekRef.current = null;
      player.seekTo(target).catch((e) => LOG('seek failed:', String(e)));
    }

    // (2) Coarse state machine.
    if (status.playing) {
      if (state !== 'playing') {
        LOG('→ playing');
        setState('playing');
      }
      if (loadTimerRef.current) {
        clearTimeout(loadTimerRef.current);
        loadTimerRef.current = null;
      }
    } else if (status.isLoaded && modeRef.current !== 'idle' && state === 'playing') {
      setState('paused');
    }

    // (3) Boundary detection — needs isLoaded for currentTime to be valid.
    if (!status.isLoaded) return;
    const t = status.currentTime ?? 0;

    if (modeRef.current === 'one' && stopAtRef.current != null) {
      if (t >= stopAtRef.current) {
        player.pause();
        stopAtRef.current = null;
        modeRef.current = 'idle';
        setState('idle');
      }
    } else if (modeRef.current === 'all') {
      const idx = clamp(Math.floor(t / nameLength) + 1, 1, 99);
      if (idx !== currentNumber) setCurrentNumber(idx);
      if (status.didJustFinish || (status.duration && t >= status.duration - 0.05)) {
        modeRef.current = 'idle';
        setState('idle');
        setCurrentNumber(null);
      }
    }
  }, [status, state, currentNumber, nameLength, player]);

  const startLoadTimer = useCallback(() => {
    if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
    loadTimerRef.current = setTimeout(() => {
      if (modeRef.current !== 'idle' && !status.playing) {
        LOG('load timeout — trying next source');
        // First failure: try the next URL in the fallback list.
        if (sourceIdx < SOURCE_URIS.length - 1) {
          setSourceIdx((i) => i + 1);
          // Replay the same intent against the new player on next render.
        } else {
          LOG('all sources exhausted, surfacing error');
          setState('error');
          modeRef.current = 'idle';
        }
      }
    }, LOAD_TIMEOUT_MS);
  }, [status.playing, sourceIdx]);

  const play = useCallback(
    (number: number) => {
      const n = clamp(number, 1, 99);
      const offset = (n - 1) * nameLength;
      LOG('play() name=', n, 'offset=', offset, 'isLoaded=', status.isLoaded);
      modeRef.current = 'one';
      stopAtRef.current = n * nameLength;
      setCurrentNumber(n);
      setState('loading');
      pendingSeekRef.current = offset;
      try {
        player.volume = 1;
        player.play();
        LOG('play() called');
      } catch (e) {
        LOG('play() threw:', String(e));
        setState('error');
      }
      startLoadTimer();
    },
    [player, nameLength, startLoadTimer, status.isLoaded],
  );

  const playAll = useCallback(
    (startFrom: number = 1) => {
      const n = clamp(startFrom, 1, 99);
      LOG('playAll() startFrom=', n, 'isLoaded=', status.isLoaded, 'duration=', status.duration);
      modeRef.current = 'all';
      stopAtRef.current = null;
      setCurrentNumber(n);
      setState('loading');
      pendingSeekRef.current = n > 1 ? (n - 1) * nameLength : null;
      try {
        player.volume = 1;
        player.play();
        LOG('playAll() called');
      } catch (e) {
        LOG('playAll() threw:', String(e));
        setState('error');
      }
      startLoadTimer();
    },
    [player, nameLength, startLoadTimer, status.isLoaded, status.duration],
  );

  const pause = useCallback(() => {
    try { player.pause(); } catch {}
    setState('paused');
  }, [player]);

  const resume = useCallback(() => {
    try { player.play(); } catch {}
    setState('playing');
  }, [player]);

  const stop = useCallback(() => {
    try { player.pause(); } catch {}
    modeRef.current = 'idle';
    stopAtRef.current = null;
    pendingSeekRef.current = null;
    if (loadTimerRef.current) {
      clearTimeout(loadTimerRef.current);
      loadTimerRef.current = null;
    }
    setCurrentNumber(null);
    setState('idle');
  }, [player]);

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

export { AudioModule };
