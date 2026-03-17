import { useState, useEffect } from 'react';
import { Magnetometer } from 'expo-sensors';
import { Platform } from 'react-native';

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
        let angle = (Math.atan2(y, x) * 180) / Math.PI;
        if (angle < 0) angle += 360;
        if (Platform.OS === 'ios') {
          angle = 360 - angle;
        }
        setHeading(angle);
      });
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  return { heading, available };
}
