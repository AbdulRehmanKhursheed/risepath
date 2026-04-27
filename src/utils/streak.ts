import type { PrayerRecord } from '../services/storage';
import { addLocalDays, getLocalDateKey } from './date';

// A day "counts" toward the streak if the user marked ≥3 of the 5 prayers.
// Tuned to be forgiving — most missed-Fajr days still count if Dhuhr/Asr/
// Maghrib are marked — without being so loose that one prayer keeps the
// streak alive. The previous useStreak hook used this same threshold; we
// preserve it for continuity.
const DAILY_THRESHOLD = 3;

function isDayActive(rec: PrayerRecord | undefined): boolean {
  if (!rec) return false;
  const count =
    Number(rec.fajr) +
    Number(rec.dhuhr) +
    Number(rec.asr) +
    Number(rec.maghrib) +
    Number(rec.isha);
  return count >= DAILY_THRESHOLD;
}

function dayKey(d: Date): string {
  return getLocalDateKey(d);
}

function daysApart(a: string, b: string): number {
  const da = new Date(a);
  da.setHours(0, 0, 0, 0);
  const db = new Date(b);
  db.setHours(0, 0, 0, 0);
  return Math.round((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24));
}

// Compute current and longest streak directly from the prayers map.
//
// `current` — the run of consecutive active days ending **today or yesterday**.
//   Today not yet active does NOT break the streak (the user still has time).
//   A miss yesterday with no entry today resets to 0.
//
// `longest` — the longest consecutive run anywhere in the user's prayer history.
//
// Source-of-truth is `storage.getPrayers()`. There is no separate streak record
// to keep in sync — the previous architecture had a separate `streak` store
// with a writer hook that was never invoked, leaving stale data on devices.
export function computeStreak(
  prayers: Record<string, PrayerRecord>
): { current: number; longest: number } {
  const activeDates = Object.keys(prayers)
    .filter((d) => isDayActive(prayers[d]))
    .sort(); // ascending YYYY-MM-DD

  if (activeDates.length === 0) return { current: 0, longest: 0 };

  // Longest run anywhere in history.
  let longest = 1;
  let run = 1;
  for (let i = 1; i < activeDates.length; i += 1) {
    if (daysApart(activeDates[i - 1], activeDates[i]) === 1) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  // Current run ending today or yesterday.
  const today = dayKey(new Date());
  const yest = dayKey(addLocalDays(new Date(), -1));
  const last = activeDates[activeDates.length - 1];

  let current = 0;
  if (last === today || last === yest) {
    current = 1;
    for (let i = activeDates.length - 2; i >= 0; i -= 1) {
      if (daysApart(activeDates[i], activeDates[i + 1]) === 1) {
        current += 1;
      } else {
        break;
      }
    }
  }

  return { current, longest: Math.max(longest, current) };
}
