// Qada (missed obligatory prayer) tracking engine. Pure functions over a
// plain-object state so the screen stays thin and everything here is unit
// testable. Counts only ever move through these helpers, which clamp to
// non-negative integers — a corrupted store or double-tap can never produce
// negative debt or NaN.

export type QadaPrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'witr';

// Display/order authority for the screen. Witr is listed last and only
// surfaced when includeWitr is on (wajib per the Hanafi school; the other
// schools treat it as sunnah and don't require qada for it).
export const QADA_PRAYER_KEYS: QadaPrayerKey[] = [
  'fajr',
  'dhuhr',
  'asr',
  'maghrib',
  'isha',
  'witr',
];

export type QadaCounts = Record<QadaPrayerKey, number>;

export type QadaState = {
  owed: QadaCounts; // prayers still to make up
  completed: QadaCounts; // made up so far (lifetime)
  includeWitr: boolean;
  createdAt: number;
  updatedAt: number;
};

// Days per estimator unit. Calendar approximations are fine here: the result
// is an explicit *estimate* the user is told to adjust, not a fiqh ruling.
const DAYS_PER_YEAR = 365;
const DAYS_PER_MONTH = 30;

export function zeroCounts(): QadaCounts {
  return { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0, witr: 0 };
}

export function emptyQadaState(now: number, includeWitr: boolean): QadaState {
  return {
    owed: zeroCounts(),
    completed: zeroCounts(),
    includeWitr,
    createdAt: now,
    updatedAt: now,
  };
}

// Clamp any external value (storage, user input) to a safe integer count.
export function clampCount(n: unknown): number {
  const v = typeof n === 'number' ? n : parseInt(String(n ?? ''), 10);
  if (!Number.isFinite(v) || v <= 0) return 0;
  return Math.min(Math.floor(v), 999_999);
}

// Re-validate a state loaded from storage; malformed fields collapse to safe
// values instead of crashing the screen.
export function sanitizeQadaState(raw: unknown, now: number): QadaState {
  const r = (raw ?? {}) as Partial<QadaState> & { owed?: unknown; completed?: unknown };
  const readCounts = (src: unknown): QadaCounts => {
    const s = (src ?? {}) as Record<string, unknown>;
    const out = zeroCounts();
    for (const k of QADA_PRAYER_KEYS) out[k] = clampCount(s[k]);
    return out;
  };
  return {
    owed: readCounts(r.owed),
    completed: readCounts(r.completed),
    includeWitr: r.includeWitr === true,
    createdAt: clampCount(r.createdAt) || now,
    updatedAt: clampCount(r.updatedAt) || now,
  };
}

// Estimate missed days from a duration. Both inputs accept raw strings from
// TextInputs; invalid/negative input counts as 0.
export function estimateMissedDays(years: unknown, months: unknown): number {
  return clampCount(clampCount(years) * DAYS_PER_YEAR + clampCount(months) * DAYS_PER_MONTH);
}

// Apply an estimate: one owed prayer of each kind per missed day. Overwrites
// owed counts (the screen confirms with the user first); completed history is
// preserved — making up prayers you've already logged can't be undone by
// re-estimating.
export function applyEstimate(state: QadaState, missedDays: number, now: number): QadaState {
  const days = clampCount(missedDays);
  const owed = zeroCounts();
  for (const k of QADA_PRAYER_KEYS) {
    if (k === 'witr' && !state.includeWitr) continue;
    owed[k] = days;
  }
  return { ...state, owed, updatedAt: now };
}

// Log one made-up prayer: owed goes down (floored at 0), completed goes up.
export function logQadaPrayed(state: QadaState, key: QadaPrayerKey, now: number): QadaState {
  if (state.owed[key] <= 0) return state;
  return {
    ...state,
    owed: { ...state.owed, [key]: state.owed[key] - 1 },
    completed: { ...state.completed, [key]: clampCount(state.completed[key] + 1) },
    updatedAt: now,
  };
}

// Undo an accidental log: the exact inverse of logQadaPrayed, floored so it
// can never fabricate completed prayers that were never logged.
export function undoQadaPrayed(state: QadaState, key: QadaPrayerKey, now: number): QadaState {
  if (state.completed[key] <= 0) return state;
  return {
    ...state,
    owed: { ...state.owed, [key]: clampCount(state.owed[key] + 1) },
    completed: { ...state.completed, [key]: state.completed[key] - 1 },
    updatedAt: now,
  };
}

// Manual per-prayer adjustment (the estimator is coarse; users refine counts).
export function setOwed(state: QadaState, key: QadaPrayerKey, value: unknown, now: number): QadaState {
  return { ...state, owed: { ...state.owed, [key]: clampCount(value) }, updatedAt: now };
}

function activeKeys(state: QadaState): QadaPrayerKey[] {
  return QADA_PRAYER_KEYS.filter((k) => k !== 'witr' || state.includeWitr);
}

export function totalOwed(state: QadaState): number {
  return activeKeys(state).reduce((sum, k) => sum + state.owed[k], 0);
}

export function totalCompleted(state: QadaState): number {
  return activeKeys(state).reduce((sum, k) => sum + state.completed[k], 0);
}

// Share of the known debt that has been repaid, in [0, 1]. Defined as 0 when
// nothing was ever owed or logged.
export function qadaProgress(state: QadaState): number {
  const done = totalCompleted(state);
  const total = done + totalOwed(state);
  if (total <= 0) return 0;
  return done / total;
}
