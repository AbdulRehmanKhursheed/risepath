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

export type AudioState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

type Mode = 'idle' | 'one' | 'all';

export type AsmaulHusnaAudio = {
  state: AudioState;
  currentNumber: number | null;
  isPlayAll: boolean;
  /** Play one name. Pauses at the approximate end of that name's slice. */
  play: (number: number) => Promise<void>;
  /** Play continuously starting from `startFrom` (default 1) through #99. */
  playAll: (startFrom?: number) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
};

// One audio file holds all 99 names back-to-back. We compute the per-name
// slice length once the player reports its duration. Until then we fall back
// to ~2.02s/name, which matches the file's known total runtime (~200s / 99).
const FALLBACK_NAME_LENGTH_S = 2.02;

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

export function useAsmaulHusnaAudio(): AsmaulHusnaAudio {
  const player = useAudioPlayer({ uri: SOURCE_URI });
  const status = useAudioPlayerStatus(player);

  const [state, setState] = useState<AudioState>('idle');
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const modeRef = useRef<Mode>('idle');
  // For single-name playback, the time (in seconds) at which we should
  // auto-pause to stop bleeding into the next name.
  const stopAtRef = useRef<number | null>(null);

  // Background audio mode + iOS silent-mode override, set once.
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'mixWithOthers',
    }).catch(() => {
      // Non-fatal — audio still plays in foreground if this fails.
    });
    return () => {
      try {
        player.pause();
      } catch {}
    };
  }, [player]);

  const nameLength =
    status.duration && status.duration > 0
      ? status.duration / 99
      : FALLBACK_NAME_LENGTH_S;

  // React to playback progress: handle single-name auto-pause and the
  // play-all current-name tracking. Also detect natural end of stream.
  useEffect(() => {
    if (!status.isLoaded) {
      if (state !== 'loading' && state !== 'idle') setState('loading');
      return;
    }

    // Map raw status to our coarser state machine.
    if (status.playing) {
      if (state !== 'playing') setState('playing');
    } else if (modeRef.current !== 'idle' && state === 'playing') {
      // Paused or finished while we still consider ourselves active.
      setState('paused');
    }

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
      // End-of-stream → stop tracking.
      if (status.didJustFinish || (status.duration && t >= status.duration - 0.05)) {
        modeRef.current = 'idle';
        setState('idle');
        setCurrentNumber(null);
      }
    }
  }, [status, state, currentNumber, nameLength, player]);

  const seekToName = useCallback(
    async (number: number) => {
      const offset = (clamp(number, 1, 99) - 1) * nameLength;
      try {
        await player.seekTo(offset);
      } catch {
        // If seek fails (e.g. before duration is known), start at 0.
      }
    },
    [player, nameLength],
  );

  const play = useCallback(
    async (number: number) => {
      setState('loading');
      modeRef.current = 'one';
      setCurrentNumber(number);
      await seekToName(number);
      // Stop just before the next name boundary.
      stopAtRef.current = number * nameLength;
      player.play();
    },
    [player, seekToName, nameLength],
  );

  const playAll = useCallback(
    async (startFrom: number = 1) => {
      setState('loading');
      modeRef.current = 'all';
      stopAtRef.current = null;
      setCurrentNumber(clamp(startFrom, 1, 99));
      await seekToName(startFrom);
      player.play();
    },
    [player, seekToName],
  );

  const pause = useCallback(() => {
    player.pause();
    setState('paused');
  }, [player]);

  const resume = useCallback(() => {
    player.play();
    setState('playing');
  }, [player]);

  const stop = useCallback(() => {
    try {
      player.pause();
    } catch {}
    modeRef.current = 'idle';
    stopAtRef.current = null;
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

// Re-export so consumers don't need to import directly from expo-audio
// when they only need to react to top-level errors.
export { AudioModule };
