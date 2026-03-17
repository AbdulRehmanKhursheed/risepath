import { useMemo } from 'react';
import { Coordinates, Qibla } from 'adhan';

/**
 * Get Qibla direction in degrees from North (0-360).
 * 0 = North, 90 = East, 180 = South, 270 = West.
 */
export function useQibla(latitude: number, longitude: number): number {
  return useMemo(() => {
    const coords = new Coordinates(latitude, longitude);
    const angle = Qibla(coords);
    return angle >= 0 ? angle : angle + 360;
  }, [latitude, longitude]);
}

export function getCardinalDirection(degrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}
