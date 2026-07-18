import { computeZakat, num, round2, ZakatInputs } from '../zakat';
import { NISAB_GOLD_GRAMS, NISAB_SILVER_GRAMS, ZAKAT_RATE } from '../../constants/zakat';

function makeInputs(partial: Partial<ZakatInputs> = {}): ZakatInputs {
  return {
    currency: '$',
    goldPricePerGram: '0',
    silverPricePerGram: '0',
    goldGrams: '0',
    silverGrams: '0',
    assets: { cash: '0', bank: '0', business: '0', receivables: '0', investments: '0' },
    liabilities: '0',
    nisabBasis: 'silver',
    ...partial,
  };
}

describe('num', () => {
  test('parses plain numbers', () => {
    expect(num('1234.5')).toBe(1234.5);
  });
  test('strips grouping commas and currency symbols', () => {
    expect(num('$1,250')).toBe(1250);
    expect(num('12,345.67')).toBe(12345.67);
  });
  test('empty / null / garbage -> 0', () => {
    expect(num('')).toBe(0);
    expect(num(null)).toBe(0);
    expect(num(undefined)).toBe(0);
    expect(num('abc')).toBe(0);
  });
  test('negative inputs collapse to 0 (no negative wealth)', () => {
    expect(num('-500')).toBe(0);
  });
  test('comma as decimal separator (TR/ID/EU keyboards)', () => {
    expect(num('1,5')).toBe(1.5);
    expect(num('1,50')).toBe(1.5);
    expect(num(',5')).toBe(0.5);
    expect(num('12345,67')).toBe(12345.67);
  });
  test('mixed separators resolved by position', () => {
    expect(num('1.234,56')).toBe(1234.56);
    expect(num('1,234.56')).toBe(1234.56);
  });
  test('single comma with 3 trailing digits stays grouping', () => {
    expect(num('1,000')).toBe(1000);
    expect(num('1,000,000')).toBe(1000000);
  });
  test('Eastern Arabic and Extended Arabic-Indic digits', () => {
    expect(num('١٥٠')).toBe(150);
    expect(num('۵۰۰')).toBe(500);
    expect(num('١٢٫٥')).toBe(12.5); // Arabic decimal separator ٫
  });
});

describe('round2', () => {
  test('rounds to 2 decimals without float drift', () => {
    expect(round2(2.005)).toBe(2.01);
    expect(round2(0.1 + 0.2)).toBe(0.3);
  });
});

describe('computeZakat — nisab gating', () => {
  test('below nisab => no zakat due', () => {
    const r = computeZakat(
      makeInputs({
        silverPricePerGram: '1', // silver nisab = 612.36
        assets: { cash: '100', bank: '0', business: '0', receivables: '0', investments: '0' },
      })
    );
    expect(r.nisabSilver).toBeCloseTo(NISAB_SILVER_GRAMS, 2);
    expect(r.meetsNisab).toBe(false);
    expect(r.zakatDue).toBe(0);
  });

  test('at/above nisab => 2.5% of net wealth', () => {
    const r = computeZakat(
      makeInputs({
        silverPricePerGram: '1', // nisab = 612.36
        assets: { cash: '10000', bank: '0', business: '0', receivables: '0', investments: '0' },
      })
    );
    expect(r.netWealth).toBe(10000);
    expect(r.meetsNisab).toBe(true);
    expect(r.zakatDue).toBe(round2(10000 * ZAKAT_RATE)); // 250
  });

  test('zero metal price => threshold 0 => never declares nisab met', () => {
    const r = computeZakat(
      makeInputs({
        assets: { cash: '1000000', bank: '0', business: '0', receivables: '0', investments: '0' },
      })
    );
    expect(r.nisabThreshold).toBe(0);
    expect(r.meetsNisab).toBe(false);
    expect(r.zakatDue).toBe(0);
  });
});

describe('computeZakat — asset aggregation', () => {
  test('gold & silver holdings valued via per-gram price', () => {
    const r = computeZakat(
      makeInputs({
        goldPricePerGram: '60',
        silverPricePerGram: '0.8',
        goldGrams: '100', // 6000
        silverGrams: '500', // 400
        nisabBasis: 'gold',
      })
    );
    expect(r.goldValue).toBe(6000);
    expect(r.silverValue).toBe(400);
    expect(r.nisabGold).toBe(round2(NISAB_GOLD_GRAMS * 60));
    expect(r.totalAssets).toBe(6400);
  });

  test('liabilities deducted; net floored at 0', () => {
    const r = computeZakat(
      makeInputs({
        silverPricePerGram: '1',
        assets: { cash: '5000', bank: '0', business: '0', receivables: '0', investments: '0' },
        liabilities: '9000',
      })
    );
    expect(r.netWealth).toBe(0);
    expect(r.zakatDue).toBe(0);
  });

  test('gold basis vs silver basis pick different thresholds', () => {
    const base = makeInputs({
      goldPricePerGram: '60',
      silverPricePerGram: '0.8',
    });
    const gold = computeZakat({ ...base, nisabBasis: 'gold' });
    const silver = computeZakat({ ...base, nisabBasis: 'silver' });
    expect(gold.nisabThreshold).toBe(gold.nisabGold);
    expect(silver.nisabThreshold).toBe(silver.nisabSilver);
    // Silver nisab is the lower monetary threshold here (0.8*612.36 < 60*87.48).
    expect(silver.nisabThreshold).toBeLessThan(gold.nisabThreshold);
  });
});
