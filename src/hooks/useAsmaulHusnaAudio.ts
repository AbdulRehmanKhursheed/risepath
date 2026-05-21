import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';

// Mishary Rashid Alafasy reciting all 99 names back-to-back. Bundled as a
// local asset (3.8 MB, 128kbps mono).
const LOCAL_SOURCE = require('../../assets/audio/asmaul-husna.mp3');

const LOG = (...args: unknown[]) => console.log('[asma-audio]', ...args);
LOG('module loaded, asset id =', LOCAL_SOURCE);

export type AudioState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export type AsmaulHusnaAudio = {
  state: AudioState;
  /** Toggle play/pause. First call loads + plays from the beginning. */
  toggle: () => void;
  /** Pause + reset to position 0. */
  stop: () => void;
};

export function useAsmaulHusnaAudio(): AsmaulHusnaAudio {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [state, setState] = useState<AudioState>('idle');

  // Set audio mode once. Matches the Quran reader's known-working setup.
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    }).catch(() => {});
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
      soundRef.current = null;
    };
  }, []);

  const onStatus = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    if (status.didJustFinish) {
      // Reached end of recitation — reset for a clean restart on next tap.
      soundRef.current?.setPositionAsync(0).catch(() => {});
      setState('idle');
      return;
    }
    if (status.isPlaying) {
      setState((prev) => (prev === 'playing' ? prev : 'playing'));
    } else {
      // Player paused (user paused, audio focus lost, etc.) — reflect it.
      setState((prev) =>
        prev === 'playing' || prev === 'loading' ? 'paused' : prev,
      );
    }
  }, []);

  const toggle = useCallback(() => {
    LOG('toggle tapped, soundRef.current =', !!soundRef.current);
    (async () => {
      try {
        if (!soundRef.current) {
          setState('loading');
          LOG('createAsync starting…');
          const { sound } = await Audio.Sound.createAsync(
            LOCAL_SOURCE,
            { shouldPlay: true },
            onStatus,
          );
          LOG('createAsync resolved, sound created');
          soundRef.current = sound;
          setState('playing');
          return;
        }
        const status = await soundRef.current.getStatusAsync();
        LOG('toggle on existing sound, isLoaded=', status.isLoaded, 'isPlaying=', (status as any).isPlaying);
        if (status.isLoaded && status.isPlaying) {
          await soundRef.current.pauseAsync();
          setState('paused');
        } else {
          await soundRef.current.playAsync();
          setState('playing');
        }
      } catch (e) {
        LOG('toggle threw:', String(e));
        setState('error');
      }
    })();
  }, [onStatus]);

  const stop = useCallback(() => {
    (async () => {
      try {
        if (soundRef.current) {
          await soundRef.current.pauseAsync();
          await soundRef.current.setPositionAsync(0);
        }
      } catch {}
      setState('idle');
    })();
  }, []);

  return { state, toggle, stop };
}
