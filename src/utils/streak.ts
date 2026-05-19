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
  // Parse YYYY-MM-DD explicitly as a local date rather than letting
  // `new Date('YYYY-MM-DD')` interpret it as UTC midnight — that can shift a
  // day in negative-UTC zones and breaks streak math near DST boundaries.
  const [ya, ma, da_] = a.split('-').map(Number);
  const [yb, mb, db_] = b.split('-').map(Number);
  const dA = new Date(ya, (ma ?? 1) - 1, da_ ?? 1);
  const dB = new Date(yb, (mb ?? 1) - 1, db_ ?? 1);
  return Math.round((dB.getTime() - dA.getTime()) / (1000 * 60 * 60 * 24));
}

// Compute current and longest streak from prayers + goal-completion days.
//
// A day counts toward the streak if EITHER:
//   • the user marked ≥3 of 5 prayers that day, OR
//   • the day appears in `goalDays` (logged when the user completed at least
//     one Home goal that day; goals themselves don't keep historical state).
//
// `current` — the run of consecutive active days ending **today or yesterday**.
//   Today not yet active does NOT break the streak (the user still has time).
// `longest` — the longest consecutive run anywhere in history.
export function computeStreak(
  prayers: Record<string, PrayerRecord>,
  goalDays: string[] = []
): { current: number; longest: number } {
  const prayerActive = Object.keys(prayers).filter((d) => isDayActive(prayers[d]));
  const merged = new Set<string>([...prayerActive, ...goalDays]);
  const activeDates = Array.from(merged).sort(); // ascending YYYY-MM-DD

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

// Milestones the user gets a celebratory toast for. Tuned for early wins
// (1, 3) so first-time users feel rewarded fast, then spaced out enough
// that long-term users still get meaningful checkpoints.
export const STREAK_MILESTONES = [1, 3, 7, 14, 30, 60, 100, 365] as const;

// Returns the highest milestone in STREAK_MILESTONES that is <= current and
// > lastCelebrated. Used by the UI to fire a single Alert when the user
// crosses a new threshold. Returns null when nothing new has been reached.
export function nextStreakMilestone(
  current: number,
  lastCelebrated: number
): number | null {
  if (current <= 0) return null;
  for (let i = STREAK_MILESTONES.length - 1; i >= 0; i -= 1) {
    const m = STREAK_MILESTONES[i];
    if (m <= current && m > lastCelebrated) return m;
  }
  return null;
}
