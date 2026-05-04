import { computeStreak } from '../streak';
import type { PrayerRecord } from '../../services/storage';

const FULL: PrayerRecord = { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true };
const THREE: PrayerRecord = { fajr: true, dhuhr: true, asr: true, maghrib: false, isha: false };
const TWO: PrayerRecord = { fajr: true, dhuhr: true, asr: false, maghrib: false, isha: false };
const ZERO: PrayerRecord = { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false };

function dateKey(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

describe('computeStreak', () => {
  test('empty record → both 0 (the bug we kept hitting in the streak ring)', () => {
    expect(computeStreak({})).toEqual({ current: 0, longest: 0 });
  });

  test('single full day today → current=1, longest=1', () => {
    expect(computeStreak({ [dateKey(0)]: FULL })).toEqual({ current: 1, longest: 1 });
  });

  test('three prayers (the threshold) counts as active day', () => {
    expect(computeStreak({ [dateKey(0)]: THREE })).toEqual({ current: 1, longest: 1 });
  });

  test('two prayers (below threshold) does NOT count', () => {
    expect(computeStreak({ [dateKey(0)]: TWO })).toEqual({ current: 0, longest: 0 });
  });

  test('5 consecutive days ending today → current=5, longest=5', () => {
    const prayers: Record<string, PrayerRecord> = {};
    for (let i = 0; i < 5; i += 1) prayers[dateKey(i)] = FULL;
    expect(computeStreak(prayers)).toEqual({ current: 5, longest: 5 });
  });

  test('today not yet active is forgiven — yesterday-anchored streak survives', () => {
    const prayers: Record<string, PrayerRecord> = {
      [dateKey(1)]: FULL,
      [dateKey(2)]: FULL,
      [dateKey(3)]: FULL,
    };
    expect(computeStreak(prayers)).toEqual({ current: 3, longest: 3 });
  });

  test('a gap breaks current but longest survives', () => {
    const prayers: Record<string, PrayerRecord> = {
      [dateKey(0)]: FULL,           // current run: 1
      [dateKey(1)]: FULL,           // current run: 2
      [dateKey(3)]: FULL,           // gap (day 2 skipped) — old run of 3 days
      [dateKey(4)]: FULL,
      [dateKey(5)]: FULL,
    };
    const r = computeStreak(prayers);
    expect(r.current).toBe(2);
    expect(r.longest).toBe(3);
  });

  test('inactive day in middle does not break if it is not really there', () => {
    // ZERO records still get filtered (count<3) so the gap is still a gap.
    const prayers: Record<string, PrayerRecord> = {
      [dateKey(0)]: FULL,
      [dateKey(1)]: ZERO,
      [dateKey(2)]: FULL,
    };
    const r = computeStreak(prayers);
    expect(r.current).toBe(1);
    expect(r.longest).toBe(1);
  });

  test('missed yesterday with no entry today → current resets to 0', () => {
    const prayers: Record<string, PrayerRecord> = {
      [dateKey(2)]: FULL,
      [dateKey(3)]: FULL,
      [dateKey(4)]: FULL,
    };
    expect(computeStreak(prayers).current).toBe(0);
    expect(computeStreak(prayers).longest).toBe(3);
  });

  test('longest is at least equal to current', () => {
    const prayers: Record<string, PrayerRecord> = {
      [dateKey(0)]: FULL,
      [dateKey(1)]: FULL,
      [dateKey(2)]: FULL,
      [dateKey(3)]: FULL,
      [dateKey(4)]: FULL,
      [dateKey(5)]: FULL,
      [dateKey(6)]: FULL,
    };
    const r = computeStreak(prayers);
    expect(r.longest).toBeGreaterThanOrEqual(r.current);
    expect(r.current).toBe(7);
  });
});
