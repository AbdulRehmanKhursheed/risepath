export type PrayerSurah = {
  surah: string;
  surahAr: string;
  number: number;
  benefit: string;
  note: string;
};

export const PRAYER_SURAHS: Record<string, PrayerSurah> = {
  fajr: {
    surah: 'Surah Yaseen',
    surahAr: 'سُورَةُ يٰسٓ',
    number: 36,
    benefit: 'Whoever reads it in the morning, their needs for the day will be met.',
    note: '📖 Recite after Fajr prayer',
  },
  dhuhr: {
    surah: 'Surah Al-Fateh',
    surahAr: 'سُورَةُ الْفَتْح',
    number: 48,
    benefit: 'A surah of great openings and blessings. Regular recitation brings barakah in rizq and affairs.',
    note: '📖 Recite after Zuhr prayer',
  },
  asr: {
    surah: 'Last 3 Ayahs of Surah Al-Hashr',
    surahAr: 'سُورَةُ الْحَشْر (آخر آيات)',
    number: 59,
    benefit: 'Whoever recites these in the morning/evening — if they die that day, they die as a martyr. (Tirmidhi)',
    note: '📖 Recite after Asr — evening remembrance',
  },
  maghrib: {
    surah: 'Surah Al-Waqiah',
    surahAr: 'سُورَةُ الْوَاقِعَة',
    number: 56,
    benefit: 'Whoever recites Surah Waqiah every night will never be afflicted by poverty. (Ibn Masud, r.a.)',
    note: '📖 Recite after Maghrib — beginning of the night',
  },
  isha: {
    surah: 'Surah Al-Mulk',
    surahAr: 'سُورَةُ الْمُلْك',
    number: 67,
    benefit: 'The Prophet (SAW) never slept without reciting Surah Mulk. It intercedes for its reciter in the grave.',
    note: '📖 Recite after Isha or before sleeping',
  },
};
