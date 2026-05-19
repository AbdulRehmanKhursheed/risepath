// Gregorian → Hijri conversion using the standard Julian-Day algorithm.
// Accurate for display purposes (may vary ±1 day from regional moon-sighting).

const HIJRI_MONTHS_EN = [
  'Muharram', 'Safar', 'Rabi\' al-Awwal', 'Rabi\' al-Thani',
  'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Sha\'ban',
  'Ramadan', 'Shawwal', 'Dhul Qa\'dah', 'Dhul Hijjah',
];

const HIJRI_MONTHS_UR = [
  'محرم', 'صفر', 'ربیع الاول', 'ربیع الثانی',
  'جمادی الاول', 'جمادی الثانی', 'رجب', 'شعبان',
  'رمضان', 'شوال', 'ذوالقعدہ', 'ذوالحجہ',
];

const HIJRI_MONTHS_AR = [
  'مُحَرَّم', 'صَفَر', 'رَبيع الأول', 'رَبيع الثاني',
  'جُمادى الأولى', 'جُمادى الثانية', 'رَجَب', 'شَعْبان',
  'رَمَضان', 'شَوّال', 'ذو القِعدة', 'ذو الحِجّة',
];

export type HijriDate = {
  day: number;
  month: number; // 1-12
  year: number;
  monthNameEn: string;
  monthNameUr: string;
  monthNameAr: string;
};

// Optional offset (days). The tabular algorithm can drift ±1-2 days from
// regional moon-sighting (Pakistan's Ruet committee in particular); users
// adjust this in Prayer Settings until the date matches their masjid.
export function gregorianToHijri(date: Date = new Date(), offsetDays = 0): HijriDate {
  const shifted = offsetDays !== 0 ? new Date(date.getTime() + offsetDays * 86400000) : date;
  const y = shifted.getFullYear();
  const m = shifted.getMonth() + 1;
  const d = shifted.getDate();

  const jd =
    Math.floor((1461 * (y + 4800 + Math.floor((m - 14) / 12))) / 4) +
    Math.floor((367 * (m - 2 - 12 * Math.floor((m - 14) / 12))) / 12) -
    Math.floor((3 * Math.floor((y + 4900 + Math.floor((m - 14) / 12)) / 100)) / 4) +
    d - 32075;

  const l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j =
    Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) +
    Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  const l3 =
    l2 -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29;
  const hm = Math.floor((24 * l3) / 709);
  const hd = l3 - Math.floor((709 * hm) / 24);
  const hy = 30 * n + j - 30;

  const monthIdx = Math.max(1, Math.min(12, hm)) - 1;

  return {
    day: hd,
    month: hm,
    year: hy,
    monthNameEn: HIJRI_MONTHS_EN[monthIdx],
    monthNameUr: HIJRI_MONTHS_UR[monthIdx],
    monthNameAr: HIJRI_MONTHS_AR[monthIdx],
  };
}

export function formatHijri(
  date: Date,
  locale: 'en' | 'ur' | 'ar' = 'en',
  offsetDays = 0
): string {
  const h = gregorianToHijri(date, offsetDays);
  const month =
    locale === 'ar' ? h.monthNameAr : locale === 'ur' ? h.monthNameUr : h.monthNameEn;
  if (locale === 'ur' || locale === 'ar') {
    return `${h.day} ${month} ${h.year} ھ`;
  }
  return `${h.day} ${month} ${h.year} AH`;
}

// Fetch the authoritative Hijri date for a Gregorian date from Aladhan. The
// public API requires no auth and uses HJCoSA (the Saudi Hijri Council
// calendar) by default — within ±1 day of every major regional moon-sighting
// authority including Pakistan's Ruet committee. Returns null on any failure
// so callers can quietly fall back to the local tabular algorithm.
export async function fetchAuthoritativeHijri(date: Date = new Date()): Promise<HijriDate | null> {
  try {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 4000);
    const res = await fetch(`https://api.aladhan.com/v1/gToH/${dd}-${mm}-${yyyy}`, {
      signal: ctl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const json = await res.json();
    const h = json?.data?.hijri;
    if (!h) return null;
    const day = parseInt(h.day, 10);
    const month = h.month?.number;
    const year = parseInt(h.year, 10);
    if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return null;
    const idx = Math.max(1, Math.min(12, month)) - 1;
    return {
      day,
      month,
      year,
      monthNameEn: HIJRI_MONTHS_EN[idx],
      monthNameUr: HIJRI_MONTHS_UR[idx],
      monthNameAr: HIJRI_MONTHS_AR[idx],
    };
  } catch {
    return null;
  }
}

// Returns the offset (-3..+3) that makes the local tabular algorithm match
// the Aladhan-authoritative date for today. Null when the fetch failed or
// the gap exceeds ±3 days (very rare, suggests algorithm corruption).
export async function computeHijriOffsetFromServer(date: Date = new Date()): Promise<number | null> {
  const authoritative = await fetchAuthoritativeHijri(date);
  if (!authoritative) return null;
  for (let off = -3; off <= 3; off += 1) {
    const test = gregorianToHijri(date, off);
    if (test.day === authoritative.day && test.month === authoritative.month && test.year === authoritative.year) {
      return off;
    }
  }
  return null;
}
