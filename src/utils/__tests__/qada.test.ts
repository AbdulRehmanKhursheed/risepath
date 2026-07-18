import {
  applyEstimate,
  clampCount,
  emptyQadaState,
  estimateMissedDays,
  logQadaPrayed,
  qadaProgress,
  sanitizeQadaState,
  setOwed,
  totalCompleted,
  totalOwed,
  undoQadaPrayed,
} from '../qada';

const NOW = 1_800_000_000_000;

describe('clampCount', () => {
  test('valid numbers pass through floored', () => {
    expect(clampCount(5)).toBe(5);
    expect(clampCount(5.9)).toBe(5);
    expect(clampCount('12')).toBe(12);
  });
  test('invalid, negative and non-finite collapse to 0', () => {
    expect(clampCount(-3)).toBe(0);
    expect(clampCount(NaN)).toBe(0);
    expect(clampCount(Infinity)).toBe(0);
    expect(clampCount('abc')).toBe(0);
    expect(clampCount(undefined)).toBe(0);
  });
  test('absurd values are capped', () => {
    expect(clampCount(10_000_000)).toBe(999_999);
  });
});

describe('estimateMissedDays', () => {
  test('years + months compose', () => {
    expect(estimateMissedDays(1, 0)).toBe(365);
    expect(estimateMissedDays(0, 2)).toBe(60);
    expect(estimateMissedDays('2', '6')).toBe(910);
  });
  test('garbage input estimates 0', () => {
    expect(estimateMissedDays('x', null)).toBe(0);
  });
});

describe('applyEstimate', () => {
  test('sets one owed prayer per day for the five prayers', () => {
    const s = applyEstimate(emptyQadaState(NOW, false), 100, NOW);
    expect(s.owed.fajr).toBe(100);
    expect(s.owed.isha).toBe(100);
    expect(s.owed.witr).toBe(0); // witr excluded unless enabled
    expect(totalOwed(s)).toBe(500);
  });
  test('includes witr when enabled', () => {
    const s = applyEstimate(emptyQadaState(NOW, true), 10, NOW);
    expect(s.owed.witr).toBe(10);
    expect(totalOwed(s)).toBe(60);
  });
  test('preserves completed history', () => {
    let s = applyEstimate(emptyQadaState(NOW, false), 5, NOW);
    s = logQadaPrayed(s, 'fajr', NOW);
    s = applyEstimate(s, 50, NOW);
    expect(s.completed.fajr).toBe(1);
    expect(s.owed.fajr).toBe(50);
  });
});

describe('logQadaPrayed / undoQadaPrayed', () => {
  test('log moves one from owed to completed', () => {
    let s = applyEstimate(emptyQadaState(NOW, false), 3, NOW);
    s = logQadaPrayed(s, 'asr', NOW);
    expect(s.owed.asr).toBe(2);
    expect(s.completed.asr).toBe(1);
  });
  test('log is a no-op at zero owed (double-tap safe)', () => {
    const s = emptyQadaState(NOW, false);
    expect(logQadaPrayed(s, 'fajr', NOW)).toBe(s);
  });
  test('undo is the exact inverse and cannot fabricate history', () => {
    let s = applyEstimate(emptyQadaState(NOW, false), 2, NOW);
    s = logQadaPrayed(s, 'isha', NOW);
    s = undoQadaPrayed(s, 'isha', NOW);
    expect(s.owed.isha).toBe(2);
    expect(s.completed.isha).toBe(0);
    expect(undoQadaPrayed(s, 'isha', NOW)).toBe(s); // nothing left to undo
  });
});

describe('setOwed', () => {
  test('manual adjustment clamps raw input', () => {
    let s = emptyQadaState(NOW, false);
    s = setOwed(s, 'maghrib', '250', NOW);
    expect(s.owed.maghrib).toBe(250);
    s = setOwed(s, 'maghrib', '-4', NOW);
    expect(s.owed.maghrib).toBe(0);
  });
});

describe('progress', () => {
  test('0 with no history, correct fraction after logging', () => {
    let s = emptyQadaState(NOW, false);
    expect(qadaProgress(s)).toBe(0);
    s = applyEstimate(s, 1, NOW); // 5 owed
    for (let i = 0; i < 5; i += 1) s = logQadaPrayed(s, 'fajr', NOW);
    // fajr owed 1 -> 0 after first log; remaining logs are no-ops
    expect(totalCompleted(s)).toBe(1);
    expect(qadaProgress(s)).toBeCloseTo(1 / 5, 5);
  });
});

describe('sanitizeQadaState', () => {
  test('malformed storage collapses to safe defaults', () => {
    const s = sanitizeQadaState({ owed: { fajr: '9', dhuhr: -2, junk: 5 }, includeWitr: 'yes' }, NOW);
    expect(s.owed.fajr).toBe(9);
    expect(s.owed.dhuhr).toBe(0);
    expect(s.includeWitr).toBe(false);
    expect(s.createdAt).toBe(NOW);
  });
  test('null input yields an empty state', () => {
    const s = sanitizeQadaState(null, NOW);
    expect(totalOwed(s)).toBe(0);
    expect(totalCompleted(s)).toBe(0);
  });
});
