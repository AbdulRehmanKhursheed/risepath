import { useState, useEffect } from 'react';
import { AppState } from 'react-native';
import * as Location from 'expo-location';
import { requestLocationPermissionOnce } from './useLocation';

// expo-location's heading API returns trueHeading on iOS automatically (the
// OS applies the magnetic declination correction using the device's known
// location), and on Android trueHeading is provided when accuracy is high
// enough — falling back to magHeading otherwise. This is the right way to
// surface a Qibla-grade bearing: a raw magnetometer reading is magnetic
// north and can be off from true north by up to ~20° in high-declination
// regions (Western Canada, Scandinavia, Russian Far East), which would
// invalidate the Qibla direction we draw on screen.

// Smoothing/throttle: raw heading events fire at sensor rate and each
// setHeading re-renders the whole SVG compass, so we low-pass filter and
// only commit meaningful changes.
const LOW_PASS_ALPHA = 0.25;
const MIN_DELTA_DEG = 0.5;
const MIN_INTERVAL_MS = 80;

export function useCompass() {
  const [heading, setHeading] = useState<number | null>(null);
  const [available, setAvailable] = useState(true);
  const [lowAccuracy, setLowAccuracy] = useState(false);

  useEffect(() => {
    let active = true;
    let starting = false;
    let watcher: Location.LocationSubscription | null = null;
    let smoothed: number | null = null;
    let lastEmitted: number | null = null;
    let lastEmitTime = 0;
    let lastLowAccuracy: boolean | null = null;

    const onHeading = (h: Location.LocationHeadingObject) => {
      if (!active) return;
      // trueHeading is -1 when uncalibrated; fall back to magHeading
      // then. This matches what most native compass apps do.
      const uncalibrated = h.trueHeading < 0;
      const raw = uncalibrated ? h.magHeading : h.trueHeading;
      if (typeof raw !== 'number' || Number.isNaN(raw)) return;
      let angle = raw % 360;
      if (angle < 0) angle += 360;

      // accuracy <= 1 means the sensor needs calibration (0–3 scale, 3 best);
      // surface it so the UI can show a calibration hint instead of a
      // confidently wrong bearing.
      const low = uncalibrated || h.accuracy <= 1;
      if (low !== lastLowAccuracy) {
        lastLowAccuracy = low;
        setLowAccuracy(low);
      }

      // Low-pass filter — blend along the shortest arc so readings straddling
      // the 0/360 seam (e.g. 359° → 1°) don't swing through ~180°.
      if (smoothed == null) {
        smoothed = angle;
      } else {
        let delta = angle - smoothed;
        if (delta > 180) delta -= 360;
        else if (delta < -180) delta += 360;
        smoothed = (smoothed + LOW_PASS_ALPHA * delta + 360) % 360;
      }

      const now = Date.now();
      if (lastEmitted != null) {
        let diff = Math.abs(smoothed - lastEmitted);
        if (diff > 180) diff = 360 - diff;
        if (diff < MIN_DELTA_DEG || now - lastEmitTime < MIN_INTERVAL_MS) return;
      }
      lastEmitted = smoothed;
      lastEmitTime = now;
      setHeading(smoothed);
    };

    // requestIfNeeded: prompt only on the initial mount; resume re-checks
    // must not re-open the OS dialog.
    async function start(requestIfNeeded: boolean) {
      if (!active || starting || watcher) return;
      starting = true;
      try {
        let { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted' && requestIfNeeded) {
          // Shared dedup wrapper — a direct requestForegroundPermissionsAsync
          // here races useLocation's concurrent request on Android and the
          // loser returns "denied" even after the user granted.
          ({ status } = await requestLocationPermissionOnce());
        }
        if (!active) return;
        if (status !== 'granted') {
          setAvailable(false);
          return;
        }
        const sub = await Location.watchHeadingAsync(onHeading);
        // Unmount can race watchHeadingAsync resolution; without this the
        // orphaned subscription keeps the heading sensor running all session.
        if (!active) {
          sub.remove();
          return;
        }
        watcher = sub;
        setAvailable(true);
      } catch {
        if (active) setAvailable(false);
      } finally {
        starting = false;
      }
    }

    start(true);

    // Granting location from OS Settings doesn't remount this screen, so
    // re-check permission whenever the app returns to the foreground.
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') start(false);
    });

    return () => {
      active = false;
      appStateSub.remove();
      watcher?.remove();
    };
  }, []);

  return { heading, available, lowAccuracy };
}
