// Islamic calendar events — the "Sacred Countdown" feature data layer.
//
// Dates here are *base anchors*. Because moonsighting differs by region
// (Saudi / Gulf, South Asia, UK, North America, etc.), each event can
// declare per-region day offsets. The effective date for a given user is
// computed as baseDate + regionOffset. This lets one Pakistani, one
// Emirati and one American see the correct date for *their* community.

export type EventType =
  | 'ramadan_start'
  | 'laylat_al_qadr'
  | 'eid_fitr'
  | 'dhul_hijjah_start'
  | 'arafah'
  | 'eid_adha'
  | 'islamic_new_year'
  | 'ashura'
  | 'arbaeen'
  | 'mawlid'
  | 'isra_miraj'
  | 'shab_e_barat';

export type Sect = 'sunni' | 'shia';

export type CalendarRegion =
  | 'saudi'          // Saudi Arabia, UAE, Qatar, Bahrain, Oman, Kuwait, Yemen
  | 'southasia'      // Pakistan, India, Bangladesh, Sri Lanka, Nepal
  | 'uk'             // United Kingdom
  | 'northamerica'   // USA, Canada (ISNA / Fiqh Council)
  | 'europe'         // Turkey, Germany, France, Netherlands, etc.
  | 'africa'         // Morocco, Egypt, Nigeria, etc.
  | 'southeastasia'  // Indonesia, Malaysia, Singapore, Brunei
  | 'global';        // Astronomical / Umm al-Qura fallback

export const CALENDAR_REGIONS: {
  id: CalendarRegion;
  labelEn: string;
  labelUr: string;
  labelAr: string;
  sample: string; // shown under the label to clarify
}[] = [
  { id: 'saudi',         labelEn: 'Saudi Arabia & Gulf',         labelUr: 'سعودی عرب اور خلیج',    labelAr: 'السعودية والخليج',     sample: 'KSA, UAE, Qatar, Kuwait, Oman, Bahrain' },
  { id: 'southasia',     labelEn: 'Pakistan & South Asia',        labelUr: 'پاکستان اور جنوبی ایشیا', labelAr: 'باكستان وجنوب آسيا',    sample: 'Pakistan, India, Bangladesh' },
  { id: 'uk',            labelEn: 'United Kingdom',               labelUr: 'برطانیہ',                labelAr: 'المملكة المتحدة',        sample: 'HMNMC / Wifaqul Ulama' },
  { id: 'northamerica',  labelEn: 'North America',                labelUr: 'شمالی امریکہ',           labelAr: 'أمريكا الشمالية',       sample: 'USA, Canada (ISNA)' },
  { id: 'europe',        labelEn: 'Turkey & Europe',              labelUr: 'ترکی اور یورپ',          labelAr: 'تركيا وأوروبا',         sample: 'Turkey, Germany, France' },
  { id: 'africa',        labelEn: 'North & West Africa',           labelUr: 'افریقہ',                 labelAr: 'إفريقيا',               sample: 'Egypt, Morocco, Nigeria' },
  { id: 'southeastasia', labelEn: 'Southeast Asia',                labelUr: 'جنوبی مشرقی ایشیا',       labelAr: 'جنوب شرق آسيا',          sample: 'Indonesia, Malaysia' },
  { id: 'global',        labelEn: 'Global / Astronomical',         labelUr: 'عالمی / فلکیاتی',         labelAr: 'عالمي / فلكي',           sample: 'Umm al-Qura default' },
];

// Per-event, per-region day offset relative to the base date.
// Empty record means "same day for all regions".
// Typical rule of thumb: Saudi/UAE is the base; South Asia lags by 1 day
// on Ramadan/Eid due to later moonsighting; UK follows Saudi for Ramadan but
// may lag by 1 on Eid al-Fitr; North America follows ISNA's astronomical
// calculation, usually matching Saudi. These are reasonable defaults — a
// user can override by switching region.
export type RegionOffsets = Partial<Record<CalendarRegion, number>>;

export type IslamicEvent = {
  id: string;
  type: EventType;
  baseDate: Date;
  nameEn: string;
  nameUr: string;
  nameAr: string;
  icon: string;
  sects?: Sect[];           // Filter by sect (e.g. Arbaeen = shia only)
  endDate?: Date;            // For multi-day events (Ramadan, Dhul Hijjah 10)
  regionOffsets?: RegionOffsets;
};

export type SacredQuote = {
  arabic?: string;
  en: string;
  ur: string;
  source: string;
};

// ───────────────────────────────────────────────────────────────────────────
// EVENT CATALOG — 2026–2028
// Base dates are anchored to Saudi/Umm al-Qura; regional offsets adjust.
// ───────────────────────────────────────────────────────────────────────────

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

// Most moon-sighted events — South Asia runs 1 day behind Saudi
const MOONSIGHT_OFFSET: RegionOffsets = { southasia: 1, africa: 0 };

export const ISLAMIC_EVENTS: IslamicEvent[] = [
  // ─── 1447 AH → 1448 AH transition ───
  { id: 'dhj-1447', type: 'dhul_hijjah_start',
    baseDate: d(2026, 5, 28), endDate: d(2026, 6, 6),
    nameEn: 'First 10 Days of Dhul Hijjah', nameUr: 'ذوالحجہ کے پہلے ۱۰ دن', nameAr: 'العشر الأوائل من ذي الحجة',
    icon: '🕋', regionOffsets: MOONSIGHT_OFFSET },
  { id: 'arafah-1447', type: 'arafah',
    baseDate: d(2026, 6, 5),
    nameEn: 'Day of Arafah', nameUr: 'یوم عرفہ', nameAr: 'يوم عرفة',
    icon: '🤲', regionOffsets: MOONSIGHT_OFFSET },
  { id: 'adha-1447', type: 'eid_adha',
    baseDate: d(2026, 6, 6),
    nameEn: 'Eid al-Adha', nameUr: 'عیدالاضحی', nameAr: 'عيد الأضحى',
    icon: '🐑', regionOffsets: MOONSIGHT_OFFSET },

  { id: 'hijri-1448', type: 'islamic_new_year',
    baseDate: d(2026, 6, 26),
    nameEn: 'Islamic New Year 1448', nameUr: 'اسلامی نیا سال ۱۴۴۸', nameAr: 'رأس السنة الهجرية ١٤٤٨',
    icon: '🌙', regionOffsets: MOONSIGHT_OFFSET },
  { id: 'ashura-1448', type: 'ashura',
    baseDate: d(2026, 7, 5),
    nameEn: 'Day of Ashura', nameUr: 'یوم عاشورہ', nameAr: 'يوم عاشوراء',
    icon: '🕯️', regionOffsets: MOONSIGHT_OFFSET },
  { id: 'arbaeen-1448', type: 'arbaeen',
    baseDate: d(2026, 8, 14),
    nameEn: 'Arbaeen', nameUr: 'اربعین', nameAr: 'الأربعين',
    icon: '🏴', sects: ['shia'], regionOffsets: MOONSIGHT_OFFSET },

  { id: 'mawlid-1448-sunni', type: 'mawlid',
    baseDate: d(2026, 9, 4),
    nameEn: 'Mawlid al-Nabi ﷺ', nameUr: 'میلاد النبی ﷺ', nameAr: 'المولد النبوي ﷺ',
    icon: '🌹', sects: ['sunni'], regionOffsets: MOONSIGHT_OFFSET },
  { id: 'mawlid-1448-shia', type: 'mawlid',
    baseDate: d(2026, 9, 9),
    nameEn: 'Mawlid al-Nabi ﷺ', nameUr: 'میلاد النبی ﷺ', nameAr: 'المولد النبوي ﷺ',
    icon: '🌹', sects: ['shia'], regionOffsets: MOONSIGHT_OFFSET },

  { id: 'isra-1448', type: 'isra_miraj',
    baseDate: d(2027, 1, 14),
    nameEn: "Isra & Mi'raj", nameUr: 'شب معراج', nameAr: 'الإسراء والمعراج',
    icon: '✨', regionOffsets: MOONSIGHT_OFFSET },
  { id: 'shabebarat-1448', type: 'shab_e_barat',
    baseDate: d(2027, 1, 31),
    nameEn: 'Shab-e-Barat', nameUr: 'شب برات', nameAr: 'ليلة البراءة',
    icon: '🕯️', regionOffsets: MOONSIGHT_OFFSET },

  // Ramadan 1448 — South Asia typically +1 day
  { id: 'ramadan-1448', type: 'ramadan_start',
    baseDate: d(2027, 2, 18), endDate: d(2027, 3, 19),
    nameEn: 'Ramadan', nameUr: 'رمضان المبارک', nameAr: 'شهر رمضان',
    icon: '🌙', regionOffsets: MOONSIGHT_OFFSET },

  // Laylat al-Qadr odd nights (21, 23, 25, 27, 29) — shift with Ramadan
  { id: 'qadr-21-1448', type: 'laylat_al_qadr', baseDate: d(2027, 3, 10),
    nameEn: 'Laylat al-Qadr — 21st Night', nameUr: 'شب قدر — ۲۱ ویں رات', nameAr: 'ليلة القدر ــ ليلة ٢١',
    icon: '✨', regionOffsets: MOONSIGHT_OFFSET },
  { id: 'qadr-23-1448', type: 'laylat_al_qadr', baseDate: d(2027, 3, 12),
    nameEn: 'Laylat al-Qadr — 23rd Night', nameUr: 'شب قدر — ۲۳ ویں رات', nameAr: 'ليلة القدر ــ ليلة ٢٣',
    icon: '✨', regionOffsets: MOONSIGHT_OFFSET },
  { id: 'qadr-25-1448', type: 'laylat_al_qadr', baseDate: d(2027, 3, 14),
    nameEn: 'Laylat al-Qadr — 25th Night', nameUr: 'شب قدر — ۲۵ ویں رات', nameAr: 'ليلة القدر ــ ليلة ٢٥',
    icon: '✨', regionOffsets: MOONSIGHT_OFFSET },
  { id: 'qadr-27-1448', type: 'laylat_al_qadr', baseDate: d(2027, 3, 16),
    nameEn: 'Laylat al-Qadr — 27th Night', nameUr: 'شب قدر — ۲۷ ویں رات', nameAr: 'ليلة القدر ــ ليلة ٢٧',
    icon: '✨', regionOffsets: MOONSIGHT_OFFSET },
  { id: 'qadr-29-1448', type: 'laylat_al_qadr', baseDate: d(2027, 3, 18),
    nameEn: 'Laylat al-Qadr — 29th Night', nameUr: 'شب قدر — ۲۹ ویں رات', nameAr: 'ليلة القدر ــ ليلة ٢٩',
    icon: '✨', regionOffsets: MOONSIGHT_OFFSET },

  { id: 'fitr-1448', type: 'eid_fitr',
    baseDate: d(2027, 3, 20),
    nameEn: 'Eid al-Fitr', nameUr: 'عیدالفطر', nameAr: 'عيد الفطر',
    icon: '🌟', regionOffsets: MOONSIGHT_OFFSET },

  // ─── 1448 AH → 1449 AH ───
  { id: 'dhj-1448', type: 'dhul_hijjah_start',
    baseDate: d(2027, 5, 18), endDate: d(2027, 5, 27),
    nameEn: 'First 10 Days of Dhul Hijjah', nameUr: 'ذوالحجہ کے پہلے ۱۰ دن', nameAr: 'العشر الأوائل من ذي الحجة',
    icon: '🕋', regionOffsets: MOONSIGHT_OFFSET },
  { id: 'arafah-1448', type: 'arafah',
    baseDate: d(2027, 5, 26),
    nameEn: 'Day of Arafah', nameUr: 'یوم عرفہ', nameAr: 'يوم عرفة',
    icon: '🤲', regionOffsets: MOONSIGHT_OFFSET },
  { id: 'adha-1448', type: 'eid_adha',
    baseDate: d(2027, 5, 27),
    nameEn: 'Eid al-Adha', nameUr: 'عیدالاضحی', nameAr: 'عيد الأضحى',
    icon: '🐑', regionOffsets: MOONSIGHT_OFFSET },
  { id: 'hijri-1449', type: 'islamic_new_year',
    baseDate: d(2027, 6, 16),
    nameEn: 'Islamic New Year 1449', nameUr: 'اسلامی نیا سال ۱۴۴۹', nameAr: 'رأس السنة الهجرية ١٤٤٩',
    icon: '🌙', regionOffsets: MOONSIGHT_OFFSET },
  { id: 'ashura-1449', type: 'ashura',
    baseDate: d(2027, 6, 25),
    nameEn: 'Day of Ashura', nameUr: 'یوم عاشورہ', nameAr: 'يوم عاشوراء',
    icon: '🕯️', regionOffsets: MOONSIGHT_OFFSET },

  { id: 'ramadan-1449', type: 'ramadan_start',
    baseDate: d(2028, 2, 7), endDate: d(2028, 3, 8),
    nameEn: 'Ramadan', nameUr: 'رمضان المبارک', nameAr: 'شهر رمضان',
    icon: '🌙', regionOffsets: MOONSIGHT_OFFSET },
  { id: 'fitr-1449', type: 'eid_fitr',
    baseDate: d(2028, 3, 9),
    nameEn: 'Eid al-Fitr', nameUr: 'عیدالفطر', nameAr: 'عيد الفطر',
    icon: '🌟', regionOffsets: MOONSIGHT_OFFSET },
];

// ───────────────────────────────────────────────────────────────────────────
// REGION AUTO-DETECT from latitude/longitude (rough country-level boxes)
// Used when the user has granted location — they can override in Settings.
// ───────────────────────────────────────────────────────────────────────────

export function detectRegionFromCoords(
  lat: number,
  lon: number
): CalendarRegion {
  // South Asia — Pakistan, India, Bangladesh, Sri Lanka, Nepal
  if (lat >= 5 && lat <= 38 && lon >= 60 && lon <= 98) return 'southasia';
  // Saudi / Gulf / Yemen — Arabian peninsula
  if (lat >= 12 && lat <= 33 && lon >= 34 && lon <= 60) return 'saudi';
  // UK & Ireland
  if (lat >= 49 && lat <= 61 && lon >= -11 && lon <= 2) return 'uk';
  // North America (continental USA + Canada)
  if (lat >= 15 && lat <= 72 && lon >= -168 && lon <= -52) return 'northamerica';
  // Southeast Asia — Indonesia, Malaysia, Singapore, Philippines, Brunei
  if (lat >= -11 && lat <= 21 && lon >= 94 && lon <= 141) return 'southeastasia';
  // Africa (broad)
  if (lat >= -35 && lat <= 37 && lon >= -18 && lon <= 52) return 'africa';
  // Turkey + continental Europe
  if (lat >= 35 && lat <= 71 && lon >= -10 && lon <= 45) return 'europe';
  return 'global';
}

// ───────────────────────────────────────────────────────────────────────────
// HELPERS — effective dates, filtering, upcoming list
// ───────────────────────────────────────────────────────────────────────────

export function applyRegionOffset(
  baseDate: Date,
  region: CalendarRegion,
  offsets?: RegionOffsets
): Date {
  const shift = offsets?.[region] ?? 0;
  if (shift === 0) return new Date(baseDate);
  const out = new Date(baseDate);
  out.setDate(out.getDate() + shift);
  return out;
}

export function getEffectiveDate(event: IslamicEvent, region: CalendarRegion): Date {
  return applyRegionOffset(event.baseDate, region, event.regionOffsets);
}

export function getEffectiveEndDate(
  event: IslamicEvent,
  region: CalendarRegion
): Date | undefined {
  if (!event.endDate) return undefined;
  return applyRegionOffset(event.endDate, region, event.regionOffsets);
}

export function getEventsForSect(
  events: IslamicEvent[],
  sect: Sect | null
): IslamicEvent[] {
  return events.filter((e) => !e.sects || !sect || e.sects.includes(sect));
}

export type ResolvedEvent = IslamicEvent & {
  effectiveDate: Date;
  effectiveEndDate?: Date;
  daysUntil: number;
};

export function getUpcomingEvents(
  sect: Sect | null,
  region: CalendarRegion,
  now: Date = new Date()
): ResolvedEvent[] {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return getEventsForSect(ISLAMIC_EVENTS, sect)
    .map<ResolvedEvent>((e) => {
      const effectiveDate = getEffectiveDate(e, region);
      const effectiveEndDate = getEffectiveEndDate(e, region);
      return {
        ...e,
        effectiveDate,
        effectiveEndDate,
        daysUntil: daysBetween(effectiveDate, now),
      };
    })
    .filter((e) => {
      // Keep events still relevant: not yet started, OR started but not ended.
      if (e.effectiveEndDate) return e.effectiveEndDate >= today;
      return e.effectiveDate >= today;
    })
    .sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime());
}

export function getNextEvent(
  sect: Sect | null,
  region: CalendarRegion,
  now: Date = new Date()
): ResolvedEvent | null {
  return getUpcomingEvents(sect, region, now)[0] ?? null;
}

export function daysBetween(date: Date, now: Date = new Date()): number {
  const a = new Date(date); a.setHours(0, 0, 0, 0);
  const b = new Date(now);  b.setHours(0, 0, 0, 0);
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

// Which milestones fire for a given event type? Bigger events get a longer
// anticipation ladder. Multi-notification cap to avoid fatigue.
export function getMilestonesFor(type: EventType): number[] {
  switch (type) {
    case 'ramadan_start':           return [30, 14, 7, 3, 1, 0];
    case 'eid_fitr':
    case 'eid_adha':                return [7, 3, 1, 0];
    case 'dhul_hijjah_start':
    case 'arafah':                  return [7, 1, 0];
    case 'laylat_al_qadr':          return [1, 0];
    case 'ashura':
    case 'mawlid':
    case 'islamic_new_year':
    case 'isra_miraj':
    case 'shab_e_barat':
    case 'arbaeen':                 return [3, 0];
    default:                        return [1, 0];
  }
}

// ───────────────────────────────────────────────────────────────────────────
// QUOTE LIBRARY — Quranic verses & Hadith keyed per event
// ───────────────────────────────────────────────────────────────────────────

export const SACRED_QUOTES: Record<EventType, SacredQuote[]> = {
  ramadan_start: [
    {
      arabic: 'شَهْرُ رَمَضَانَ الَّذِي أُنْزِلَ فِيهِ الْقُرْآنُ',
      en: 'The month of Ramadan — in which the Qur\'an was revealed, a guidance for people.',
      ur: 'رمضان وہ مہینہ ہے جس میں قرآن نازل ہوا، لوگوں کے لیے ہدایت۔',
      source: "Qur'an 2:185",
    },
    {
      arabic: 'مَنْ صَامَ رَمَضَانَ إِيمَانًا وَاحْتِسَابًا غُفِرَ لَهُ مَا تَقَدَّمَ مِنْ ذَنْبِهِ',
      en: 'Whoever fasts Ramadan out of faith, seeking reward — his past sins will be forgiven.',
      ur: 'جس نے ایمان اور ثواب کی نیت سے رمضان کے روزے رکھے، اس کے پچھلے گناہ معاف کر دیے جاتے ہیں۔',
      source: 'Bukhari 38',
    },
    {
      en: 'The gates of Paradise are opened, the gates of Hell are closed, and the devils are chained.',
      ur: 'جنت کے دروازے کھول دیے جاتے ہیں، جہنم کے دروازے بند کر دیے جاتے ہیں، اور شیاطین زنجیروں میں جکڑ دیے جاتے ہیں۔',
      source: 'Bukhari 1899',
    },
  ],
  laylat_al_qadr: [
    {
      arabic: 'لَيْلَةُ الْقَدْرِ خَيْرٌ مِنْ أَلْفِ شَهْرٍ',
      en: 'The Night of Decree is better than a thousand months.',
      ur: 'شبِ قدر ہزار مہینوں سے بہتر ہے۔',
      source: "Qur'an 97:3",
    },
    {
      arabic: 'اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي',
      en: 'O Allah, You are Pardoning, You love to pardon, so pardon me.',
      ur: 'اے اللہ! بےشک تُو معاف کرنے والا ہے، معافی کو پسند کرتا ہے، پس مجھے معاف کر دے۔',
      source: "Prophet's dua — Tirmidhi 3513",
    },
  ],
  eid_fitr: [
    {
      arabic: 'وَلِتُكَبِّرُوا اللَّهَ عَلَىٰ مَا هَدَاكُمْ وَلَعَلَّكُمْ تَشْكُرُونَ',
      en: 'And [so] that you magnify Allah for the guidance He has given you, and that you may be grateful.',
      ur: 'اور اللہ کی کبریائی بیان کرو اس ہدایت پر جو اس نے تمہیں دی، اور تاکہ تم شکر گزار بنو۔',
      source: "Qur'an 2:185",
    },
    {
      en: 'Taqabbal Allahu minna wa minkum — may Allah accept from us and from you.',
      ur: 'تقبل اللہ منا و منکم — اللہ ہم سے اور آپ سے قبول فرمائے۔',
      source: "Companions' greeting",
    },
  ],
  dhul_hijjah_start: [
    {
      arabic: 'مَا مِنْ أَيَّامٍ الْعَمَلُ الصَّالِحُ فِيهِنَّ أَحَبُّ إِلَى اللَّهِ مِنْ هَذِهِ الْأَيَّامِ الْعَشْرِ',
      en: 'No days are more beloved to Allah for righteous deeds than these ten days.',
      ur: 'اللہ کے نزدیک ان دس دنوں سے زیادہ کوئی دن نہیں جن میں نیک عمل اسے زیادہ محبوب ہوں۔',
      source: 'Bukhari 969',
    },
  ],
  arafah: [
    {
      arabic: 'خَيْرُ الدُّعَاءِ دُعَاءُ يَوْمِ عَرَفَةَ',
      en: 'The best supplication is the supplication on the Day of Arafah.',
      ur: 'بہترین دعا یوم عرفہ کی دعا ہے۔',
      source: 'Tirmidhi 3585',
    },
    {
      en: 'Fasting the Day of Arafah expiates sins of the previous year and the year to come.',
      ur: 'یوم عرفہ کا روزہ پچھلے اور آنے والے سال کے گناہوں کا کفارہ ہے۔',
      source: 'Muslim 1162',
    },
  ],
  eid_adha: [
    {
      arabic: 'فَصَلِّ لِرَبِّكَ وَانْحَرْ',
      en: 'So pray to your Lord and sacrifice.',
      ur: 'پس اپنے رب کے لیے نماز پڑھیے اور قربانی کیجیے۔',
      source: "Qur'an 108:2",
    },
    {
      en: 'It is neither the meat nor blood that reaches Allah — it is your piety that reaches Him.',
      ur: 'اللہ تک نہ ان کا گوشت پہنچتا ہے نہ خون، بلکہ تمہاری تقویٰ پہنچتی ہے۔',
      source: "Qur'an 22:37",
    },
  ],
  islamic_new_year: [
    {
      en: 'A new Hijri year. The first migration was of bodies; the best migration is of hearts — from sin to sincerity.',
      ur: 'ایک نیا ہجری سال۔ پہلی ہجرت جسموں کی تھی؛ بہترین ہجرت دلوں کی ہے — گناہ سے اخلاص کی طرف۔',
      source: 'Reflection',
    },
  ],
  ashura: [
    {
      en: 'Fasting the Day of Ashura — I hope Allah will expiate for the year before.',
      ur: 'یوم عاشورہ کا روزہ — مجھے امید ہے کہ اللہ پچھلے سال کے گناہ معاف کر دے گا۔',
      source: 'Muslim 1162',
    },
  ],
  arbaeen: [
    {
      en: 'Forty days after Ashura — a remembrance of sacrifice, patience, and standing for justice.',
      ur: 'عاشورہ کے چالیس دن بعد — قربانی، صبر اور عدل پر ڈٹے رہنے کی یاد۔',
      source: 'Tradition',
    },
  ],
  mawlid: [
    {
      arabic: 'وَمَا أَرْسَلْنَاكَ إِلَّا رَحْمَةً لِلْعَالَمِينَ',
      en: 'We have not sent you except as a mercy to the worlds.',
      ur: 'اور ہم نے آپ کو تمام جہانوں کے لیے رحمت بنا کر بھیجا ہے۔',
      source: "Qur'an 21:107",
    },
  ],
  isra_miraj: [
    {
      arabic: 'سُبْحَانَ الَّذِي أَسْرَىٰ بِعَبْدِهِ لَيْلًا',
      en: 'Glory to the One who took His servant by night on a journey…',
      ur: 'پاک ہے وہ ذات جو اپنے بندے کو ایک رات لے گیا…',
      source: "Qur'an 17:1",
    },
  ],
  shab_e_barat: [
    {
      en: 'On this night Allah looks upon His creation and forgives all except the one who associates partners with Him or holds enmity.',
      ur: 'اس رات اللہ اپنی مخلوق پر نظر فرماتا ہے اور سب کو بخش دیتا ہے سوائے مشرک اور کینہ پرور کے۔',
      source: 'Ibn Majah 1390',
    },
  ],
};

export function getQuoteForEvent(type: EventType, seed = 0): SacredQuote {
  const quotes = SACRED_QUOTES[type] ?? SACRED_QUOTES.ramadan_start;
  return quotes[Math.abs(seed) % quotes.length];
}
