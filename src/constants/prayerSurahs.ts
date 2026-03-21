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
    benefit: 'Surah Yaseen is the heart of the Quran. It is narrated that reciting it in the morning brings barakah to one\'s day. (Abu Ya\'la — see scholars\' note below)',
    note: '📖 Recite after Fajr prayer · Note: consult a scholar on authenticity',
  },
  dhuhr: {
    surah: 'Surah Al-Fath',
    surahAr: 'سُورَةُ الْفَتْح',
    number: 48,
    benefit: 'A surah of great openings and victories, revealed after the Treaty of Hudaybiyyah. Its recitation is a reminder of Allah\'s help and blessing upon the believers.',
    note: '📖 Recite after Zuhr prayer',
  },
  asr: {
    surah: 'Last 3 Ayahs of Surah Al-Hashr',
    surahAr: 'سُورَةُ الْحَشْر (آخر آيات)',
    number: 59,
    benefit: 'It is narrated: "Whoever says Bismillah then recites the last 3 ayahs of Al-Hashr in the morning and evening, Allah appoints 70,000 angels to pray for him." (Tirmidhi — hasan gharib)',
    note: '📖 Recite after Asr — evening remembrance',
  },
  maghrib: {
    surah: 'Surah Al-Waqiah',
    surahAr: 'سُورَةُ الْوَاقِعَة',
    number: 56,
    benefit: 'Ibn Masud (RA) is reported to have said: "Teach your women Surah Al-Waqiah, for it is the Surah of abundance." Regular recitation is a means of remembering the Day of Reckoning and seeking Allah\'s provision. (Reported in Bayhaqi — chain debated; act on intent of seeking Allah\'s rizq)',
    note: '📖 Recite after Maghrib — beginning of the night',
  },
  isha: {
    surah: 'Surah Al-Mulk',
    surahAr: 'سُورَةُ الْمُلْك',
    number: 67,
    benefit: 'The Prophet ﷺ would not sleep until he had recited Surah Al-Mulk. It is the surah that intercedes for its reciter in the grave. (Tirmidhi, Abu Dawud — authenticated by scholars)',
    note: '📖 Recite after Isha or before sleeping',
  },
};
