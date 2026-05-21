import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AudioModule,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';

// Single continuous recitation by Mishary Rashid Alafasy.
// Archive.org auto-redirects to the nearest mirror; supports range requests.
// All 99 names recited back-to-back in the standard Tirmidhi enumeration order.
const SOURCE_URI =
  'https://archive.org/download/asmaul-husna-mishary/Asmaul_Husna_Mishary.mp3';

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
  const player = useAudioPlayer(SOURCE_URI);
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
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'mixWithOthers',
    }).catch(() => {});
    return () => {
      try {
        player.pause();
      } catch {}
      if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
    };
  }, [player]);

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
    // (1) Apply a deferred seek once the audio is actually loaded.
    if (status.isLoaded && pendingSeekRef.current != null) {
      const target = pendingSeekRef.current;
      pendingSeekRef.current = null;
      player.seekTo(target).catch(() => {});
    }

    // (2) Coarse state machine.
    if (status.playing) {
      if (state !== 'playing') setState('playing');
      // Loaded + playing → clear the load timeout.
      if (loadTimerRef.current) {
        clearTimeout(loadTimerRef.current);
        loadTimerRef.current = null;
      }
    } else if (status.isLoaded && modeRef.current !== 'idle' && state === 'playing') {
      // Was playing, now paused for some reason (didFinish, user pause, etc.)
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
      // If we're still trying to load after the deadline, surface the error
      // so the UI can show 'Audio unavailable' instead of hanging on Loading…
      if (modeRef.current !== 'idle' && !status.playing) {
        setState('error');
        modeRef.current = 'idle';
      }
    }, LOAD_TIMEOUT_MS);
  }, [status.playing]);

  const play = useCallback(
    (number: number) => {
      const n = clamp(number, 1, 99);
      const offset = (n - 1) * nameLength;
      modeRef.current = 'one';
      stopAtRef.current = n * nameLength;
      setCurrentNumber(n);
      setState('loading');
      pendingSeekRef.current = offset;
      // Kick off playback immediately — expo-audio will buffer and start
      // playing once loaded. The pending-seek effect will fire as soon as
      // isLoaded flips true, so we land on the right name.
      try {
        player.play();
      } catch {
        setState('error');
      }
      startLoadTimer();
    },
    [player, nameLength, startLoadTimer],
  );

  const playAll = useCallback(
    (startFrom: number = 1) => {
      const n = clamp(startFrom, 1, 99);
      modeRef.current = 'all';
      stopAtRef.current = null;
      setCurrentNumber(n);
      setState('loading');
      // Only request a seek if we're not starting from the beginning. This
      // avoids the common Play All case ever depending on seek availability.
      pendingSeekRef.current = n > 1 ? (n - 1) * nameLength : null;
      try {
        player.play();
      } catch {
        setState('error');
      }
      startLoadTimer();
    },
    [player, nameLength, startLoadTimer],
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
