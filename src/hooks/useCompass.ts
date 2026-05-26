import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

// expo-location's heading API returns trueHeading on iOS automatically (the
// OS applies the magnetic declination correction using the device's known
// location), and on Android trueHeading is provided when accuracy is high
// enough — falling back to magHeading otherwise. This is the right way to
// surface a Qibla-grade bearing: a raw magnetometer reading is magnetic
// north and can be off from true north by up to ~20° in high-declination
// regions (Western Canada, Scandinavia, Russian Far East), which would
// invalidate the Qibla direction we draw on screen.
export function useCompass() {
  const [heading, setHeading] = useState<number | null>(null);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    let active = true;
    let watcher: Location.LocationSubscription | null = null;

    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') {
          const req = await Location.requestForegroundPermissionsAsync();
          if (!active) return;
          if (req.status !== 'granted') {
            setAvailable(false);
            return;
          }
        }
        if (!active) return;
        watcher = await Location.watchHeadingAsync((h) => {
          if (!active) return;
          // trueHeading is -1 when uncalibrated; fall back to magHeading
          // then. This matches what most native compass apps do.
          const raw = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
          if (typeof raw !== 'number' || Number.isNaN(raw)) return;
          let angle = raw % 360;
          if (angle < 0) angle += 360;
          setHeading(angle);
        });
      } catch {
        if (active) setAvailable(false);
      }
    })();

    return () => {
      active = false;
      watcher?.remove();
    };
  }, []);

  return { heading, available };
}
