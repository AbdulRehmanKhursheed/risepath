import { useState, useEffect } from 'react';
import { Magnetometer } from 'expo-sensors';

/**
 * Returns device heading in degrees (0-360) from magnetic North.
 * Uses Magnetometer. May be inaccurate on some devices.
 */
export function useCompass() {
  const [heading, setHeading] = useState<number | null>(null);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;

    Magnetometer.isAvailableAsync().then((isAvail) => {
      if (!isAvail) {
        setAvailable(false);
        return;
      }
      Magnetometer.setUpdateInterval(100);
      subscription = Magnetometer.addListener((data) => {
        const { x, y } = data;
        // atan2(-x, y) gives the clockwise bearing from North for the TOP of the
        // phone (camera end). Using atan2(x, y) points to the BOTTOM (charging port),
        // which is 180° wrong — exactly the symptom the user reported.
        let angle = (Math.atan2(-x, y) * 180) / Math.PI;
        if (angle < 0) angle += 360;
        setHeading(angle);
      });
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  return { heading, available };
}
