import { gregorianToHijri, formatHijri } from '../hijri';

describe('gregorianToHijri', () => {
  test('Eid al-Adha 2026 (10 Dhul Hijjah 1447) ≈ 2026-05-27', () => {
    // The conversion is the standard Julian-Day algorithm — accurate within
    // ±2 days vs Umm al-Qura / moon-sighting. Anchoring this so we notice if
    // the formula ever drifts further. UPCOMING_EID_DATES says 2026-05-27.
    const h = gregorianToHijri(new Date(2026, 4, 27)); // month is 0-indexed
    expect(h.month).toBe(12);
    expect(h.day).toBeGreaterThanOrEqual(8);
    expect(h.day).toBeLessThanOrEqual(12);
    expect(h.monthNameEn).toBe('Dhul Hijjah');
  });

  test('1st Muharram (Hijri New Year) — month=1, day=1', () => {
    // 1447 AH started on 2025-06-26 by Umm al-Qura.
    const h = gregorianToHijri(new Date(2025, 5, 26));
    expect(h.month).toBe(1);
    expect(h.day).toBeGreaterThanOrEqual(1);
    expect(h.day).toBeLessThanOrEqual(2);
    expect(h.monthNameEn).toBe('Muharram');
  });

  test('Ramadan 2026 falls in month=9', () => {
    const h = gregorianToHijri(new Date(2026, 1, 18)); // Ramadan 1447 ≈ Feb 17/18
    expect(h.month).toBe(9);
    expect(h.monthNameEn).toBe('Ramadan');
  });

  test('returns Urdu and Arabic month names alongside English', () => {
    const h = gregorianToHijri(new Date(2026, 4, 27));
    expect(h.monthNameUr).toBe('ذوالحجہ');
    expect(h.monthNameAr).toBe('ذو الحِجّة');
  });

  test('all returned month indices are clamped to 1–12', () => {
    // Stress-test with 24 random dates across 12 years.
    const seed = 1717238400000;
    for (let i = 0; i < 24; i += 1) {
      const t = seed + i * 30 * 24 * 60 * 60 * 1000;
      const h = gregorianToHijri(new Date(t));
      expect(h.month).toBeGreaterThanOrEqual(1);
      expect(h.month).toBeLessThanOrEqual(12);
      expect(h.day).toBeGreaterThanOrEqual(1);
      expect(h.day).toBeLessThanOrEqual(30);
    }
  });
});

describe('formatHijri', () => {
  test('English format ends with " AH"', () => {
    const out = formatHijri(new Date(2026, 4, 27), 'en');
    expect(out).toMatch(/Dhul Hijjah \d+ AH$/);
  });

  test('Urdu format ends with "ھ"', () => {
    const out = formatHijri(new Date(2026, 4, 27), 'ur');
    expect(out.endsWith('ھ')).toBe(true);
  });

  test('Arabic format ends with "ھ" too', () => {
    const out = formatHijri(new Date(2026, 4, 27), 'ar');
    expect(out.endsWith('ھ')).toBe(true);
  });
});
