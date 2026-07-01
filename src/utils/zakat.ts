import {
  NISAB_GOLD_GRAMS,
  NISAB_SILVER_GRAMS,
  ZAKAT_RATE,
  ZakatFieldKey,
} from '../constants/zakat';

export type NisabBasis = 'gold' | 'silver';

// Raw string inputs as typed in the UI (kept as strings so a half-typed
// number never coerces to NaN mid-edit). Everything is parsed here in one
// place via `num()`.
export type ZakatInputs = {
  currency: string;
  goldPricePerGram: string;
  silverPricePerGram: string;
  goldGrams: string;
  silverGrams: string;
  // Monetary asset categories, keyed by ZakatFieldKey.
  assets: Record<ZakatFieldKey, string>;
  // Liabilities the user can immediately deduct (debts due now, bills).
  liabilities: string;
  // null => auto-pick from madhab (resolved by the caller before compute).
  nisabBasis: NisabBasis;
};

export type ZakatResult = {
  goldValue: number;
  silverValue: number;
  monetaryAssets: number;
  totalAssets: number;
  liabilities: number;
  netWealth: number;
  nisabGold: number;
  nisabSilver: number;
  nisabThreshold: number;   // threshold for the selected basis
  basis: NisabBasis;
  meetsNisab: boolean;
  zakatDue: number;         // 0 when below nisab
};

// Parse a user-entered numeric string safely. Strips grouping commas and any
// stray currency symbols/spaces; negatives and non-finite values collapse to
// 0 so a stray '-' or 'e' can never produce a negative or NaN total.
export function num(raw: string | undefined | null): number {
  if (!raw) return 0;
  const s = String(raw);
  // Reject anything with a minus sign outright — wealth is never negative, and
  // stripping the sign would silently turn "-500" into 500.
  if (s.includes('-')) return 0;
  const cleaned = s.replace(/[^0-9.]/g, '');
  const n = parseFloat(cleaned);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

// Round money to 2dp without floating-point drift (e.g. 2.005 -> 2.01).
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function computeZakat(inputs: ZakatInputs): ZakatResult {
  const goldPrice = num(inputs.goldPricePerGram);
  const silverPrice = num(inputs.silverPricePerGram);

  const goldValue = round2(num(inputs.goldGrams) * goldPrice);
  const silverValue = round2(num(inputs.silverGrams) * silverPrice);

  const monetaryAssets =
    num(inputs.assets.cash) +
    num(inputs.assets.bank) +
    num(inputs.assets.business) +
    num(inputs.assets.receivables) +
    num(inputs.assets.investments);

  const totalAssets = round2(goldValue + silverValue + monetaryAssets);
  const liabilities = round2(num(inputs.liabilities));
  const netWealth = round2(Math.max(0, totalAssets - liabilities));

  const nisabGold = round2(NISAB_GOLD_GRAMS * goldPrice);
  const nisabSilver = round2(NISAB_SILVER_GRAMS * silverPrice);
  const basis: NisabBasis = inputs.nisabBasis === 'gold' ? 'gold' : 'silver';
  const nisabThreshold = basis === 'gold' ? nisabGold : nisabSilver;

  // Only a *positive* nisab threshold can gate. If the user hasn't entered the
  // relevant metal price yet, the threshold is 0 — treat that as "not enough
  // info to say you owe zakat" rather than "everyone owes", so we require a
  // positive threshold before declaring nisab met.
  const meetsNisab = nisabThreshold > 0 && netWealth >= nisabThreshold;
  const zakatDue = meetsNisab ? round2(netWealth * ZAKAT_RATE) : 0;

  return {
    goldValue,
    silverValue,
    monetaryAssets: round2(monetaryAssets),
    totalAssets,
    liabilities,
    netWealth,
    nisabGold,
    nisabSilver,
    nisabThreshold,
    basis,
    meetsNisab,
    zakatDue,
  };
}
