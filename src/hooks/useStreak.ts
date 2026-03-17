import { useState, useEffect, useCallback } from 'react';
import { storage, StreakData } from '../services/storage';
import type { PrayerRecord } from '../services/storage';

function getDateString(d: Date): string {
  return d.toISOString().split('T')[0];
}

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getDateString(d);
}

export function useStreak(
  prayers: Record<string, PrayerRecord>,
  goalsCompletedToday?: number
) {
  const [streakData, setStreakData] = useState<StreakData | null>(null);

  useEffect(() => {
    storage.getStreak().then(setStreakData);
  }, []);

  const updateStreak = useCallback(async () => {
    const yesterday = getYesterday();
    const yesterdayPrayers = prayers[yesterday];
    const prayersCount = yesterdayPrayers
      ? [
          yesterdayPrayers.fajr,
          yesterdayPrayers.dhuhr,
          yesterdayPrayers.asr,
          yesterdayPrayers.maghrib,
          yesterdayPrayers.isha,
        ].filter(Boolean).length
      : 0;

    const current = streakData?.current ?? 0;
    const lastDate = streakData?.lastDate ?? '';
    const longest = streakData?.longest ?? 0;

    let newCurrent = current;
    let newLongest = longest;

    if (prayersCount >= 3 && (goalsCompletedToday ?? 1) >= 1) {
      if (lastDate === yesterday) {
        newCurrent = current;
      } else if (lastDate === getDateString(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000))) {
        newCurrent = current + 1;
      } else {
        newCurrent = 1;
      }
      newLongest = Math.max(newLongest, newCurrent);
    } else if (lastDate === yesterday) {
      newCurrent = 0;
    }

    const today = getDateString(new Date());
    const newData: StreakData = {
      current: newCurrent,
      lastDate: today,
      longest: newLongest,
    };

    setStreakData(newData);
    await storage.setStreak(newData);
  }, [streakData, prayers, goalsCompletedToday]);

  return {
    streak: streakData?.current ?? 0,
    longest: streakData?.longest ?? 0,
    updateStreak,
    streakData,
  };
}
