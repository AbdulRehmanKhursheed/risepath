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

export function gregorianToHijri(date: Date = new Date()): HijriDate {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();

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

export function formatHijri(date: Date, locale: 'en' | 'ur' | 'ar' = 'en'): string {
  const h = gregorianToHijri(date);
  const month =
    locale === 'ar' ? h.monthNameAr : locale === 'ur' ? h.monthNameUr : h.monthNameEn;
  if (locale === 'ur' || locale === 'ar') {
    return `${h.day} ${month} ${h.year} ھ`;
  }
  return `${h.day} ${month} ${h.year} AH`;
}
