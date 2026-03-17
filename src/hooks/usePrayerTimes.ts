import { useMemo } from 'react';
import {
  PrayerTimes,
  Coordinates,
  CalculationMethod,
  Madhab,
} from 'adhan';
import type { CalculationMethodId, MadhabId } from '../constants/prayerMethods';

export type PrayerName = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export type PrayerTimeInfo = {
  name: string;
  key: PrayerName;
  time: Date;
};

const METHOD_MAP: Record<CalculationMethodId, () => ReturnType<typeof CalculationMethod.Karachi>> = {
  MuslimWorldLeague: () => CalculationMethod.MuslimWorldLeague(),
  Egyptian: () => CalculationMethod.Egyptian(),
  Karachi: () => CalculationMethod.Karachi(),
  UmmAlQura: () => CalculationMethod.UmmAlQura(),
  Dubai: () => CalculationMethod.Dubai(),
  MoonsightingCommittee: () => CalculationMethod.MoonsightingCommittee(),
  NorthAmerica: () => CalculationMethod.NorthAmerica(),
  Kuwait: () => CalculationMethod.Kuwait(),
  Qatar: () => CalculationMethod.Qatar(),
  Singapore: () => CalculationMethod.Singapore(),
  Tehran: () => CalculationMethod.Tehran(),
  Turkey: () => CalculationMethod.Turkey(),
  Other: () => CalculationMethod.Other(),
};

const MADHAB_MAP = {
  Shafi: Madhab.Shafi,
  Hanafi: Madhab.Hanafi,
} as const;

export function usePrayerTimes(
  latitude: number,
  longitude: number,
  date: Date = new Date(),
  calculationMethod: CalculationMethodId = 'Karachi',
  madhab: MadhabId = 'Shafi'
): PrayerTimeInfo[] {
  return useMemo(() => {
    const coords = new Coordinates(latitude, longitude);
    const params = METHOD_MAP[calculationMethod]?.() ?? CalculationMethod.Karachi();
    params.madhab = MADHAB_MAP[madhab] ?? Madhab.Shafi;

    const adhanTimes = new PrayerTimes(coords, date, params);

    const prayers: PrayerTimeInfo[] = [
      { name: 'Fajr', key: 'fajr', time: adhanTimes.fajr },
      { name: 'Dhuhr', key: 'dhuhr', time: adhanTimes.dhuhr },
      { name: 'Asr', key: 'asr', time: adhanTimes.asr },
      { name: 'Maghrib', key: 'maghrib', time: adhanTimes.maghrib },
      { name: 'Isha', key: 'isha', time: adhanTimes.isha },
    ];

    return prayers;
  }, [latitude, longitude, date.getTime(), calculationMethod, madhab]);
}

export function formatPrayerTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
