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

  // Cleanup the sound on unmount. (setAudioModeAsync moved into toggle()
  // so it's awaited right before load, matching the Quran-reader pattern
  // that works reliably on the same devices that broke this hook.)
  useEffect(() => {
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
          // Await the audio mode BEFORE creating the sound. With this in
          // useEffect it could race the first tap and silently leave the
          // sound created without a proper audio session.
          await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            shouldDuckAndroid: true,
          }).catch((e) => LOG('audio mode error:', String(e)));
          LOG('createAsync starting…');
          // Create with shouldPlay:false; explicitly play afterwards so
          // we can log + handle the play call independently.
          const { sound } = await Audio.Sound.createAsync(
            LOCAL_SOURCE,
            { shouldPlay: false, volume: 1.0 },
            onStatus,
          );
          LOG('createAsync resolved');
          soundRef.current = sound;
          await sound.setVolumeAsync(1.0).catch(() => {});
          const playRes = await sound.playAsync();
          LOG('first playAsync result isPlaying=', (playRes as any).isPlaying, 'isBuffering=', (playRes as any).isBuffering);
          setState('playing');
          return;
        }
        const status = await soundRef.current.getStatusAsync();
        LOG('toggle on existing sound, isLoaded=', status.isLoaded, 'isPlaying=', (status as any).isPlaying);
        if (status.isLoaded && (status as any).isPlaying) {
          await soundRef.current.pauseAsync();
          setState('paused');
        } else {
          await soundRef.current.setPositionAsync(0).catch(() => {});
          await soundRef.current.setVolumeAsync(1.0).catch(() => {});
          const r = await soundRef.current.playAsync();
          LOG('replay playAsync result isPlaying=', (r as any).isPlaying);
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
