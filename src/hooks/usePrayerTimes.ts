import { useMemo } from 'react';
import {
  PrayerTimes,
  Coordinates,
  CalculationMethod,
  CalculationParameters,
  Madhab,
} from 'adhan';
import type { CalculationMethodId, MadhabId } from '../constants/prayerMethods';

export type PrayerName = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export type PrayerTimeInfo = {
  name: string;
  key: PrayerName;
  time: Date;
};

/**
 * Custom Jafari (Shia Ithna-Ashari / Leva Research Institute, Qum) parameters.
 * Fajr: 16°, Isha: 14°, Maghrib: 4° after sunset (when redness fades from east).
 * Source: praytimes.org/wiki/Calculation_Methods & eahlulbayt.com/pages/calculating-method
 */
function buildJafariParams(): CalculationParameters {
  const params = CalculationMethod.Other();
  params.fajrAngle = 16;
  params.ishaAngle = 14;
  params.maghribAngle = 4;
  return params;
}

const METHOD_MAP: Record<CalculationMethodId, () => CalculationParameters> = {
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
  Jafari: buildJafariParams,
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
  // Use day-level key so recalculation only happens when the calendar date changes,
  // not on every render (which would thrash notification scheduling).
  }, [latitude, longitude, date.getFullYear(), date.getMonth(), date.getDate(), calculationMethod, madhab]);
}

export function formatPrayerTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
