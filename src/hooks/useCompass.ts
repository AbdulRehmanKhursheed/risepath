import { useState, useEffect } from 'react';
import { Magnetometer } from 'expo-sensors';

export function useCompass() {
  const [heading, setHeading] = useState<number | null>(null);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;
    // Guard against the isAvailableAsync → addListener race: if the component
    // unmounts before the availability check resolves, the listener would be
    // attached after cleanup ran and leak forever.
    let active = true;

    Magnetometer.isAvailableAsync().then((isAvail) => {
      if (!active) return;
      if (!isAvail) {
        setAvailable(false);
        return;
      }
      Magnetometer.setUpdateInterval(100);
      subscription = Magnetometer.addListener((data) => {
        if (!active) return;
        const { x, y } = data;
        // atan2(-x, y) gives the clockwise bearing from North for the TOP of the
        // phone (camera end). Using atan2(x, y) points to the BOTTOM (charging port),
        // which is 180° wrong.
        let angle = (Math.atan2(-x, y) * 180) / Math.PI;
        if (angle < 0) angle += 360;
        setHeading(angle);
      });
    });

    return () => {
      active = false;
      subscription?.remove();
    };
  }, []);

  return { heading, available };
}
