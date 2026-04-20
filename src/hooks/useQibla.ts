import { useMemo } from 'react';
import { Coordinates, Qibla } from 'adhan';

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
