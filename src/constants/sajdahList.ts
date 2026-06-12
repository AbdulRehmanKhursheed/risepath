// Verses where the reader (and listener) is recommended to perform
// Sajdat al-Tilawah (the prostration of recitation). The Madinah Mushaf
// (King Fahd Complex) marks 15 places with ۩. The schools' counts of ~14
// disagree in opposite directions on two of them: Hanafi counts Sad 38:24
// but not the second Hajj sajdah 22:77; Shafi'i & Hanbali count 22:77 but
// treat 38:24 as a sajdah of gratitude. Both carry fiqh notes below so the
// list covers every position a physical Madinah mushaf marks.
//
// Sources: Sahih al-Bukhari (Book 19), Sahih Muslim (Book 5), and the
// standardized Madinah Mushaf legend.
export type SajdahVerse = {
  surah: number;
  ayah: number;
  // Optional fiqh note for ayahs where schools differ.
  note?: string;
};

export const SAJDAH_VERSES: SajdahVerse[] = [
  { surah: 7,  ayah: 206 },
  { surah: 13, ayah: 15 },
  { surah: 16, ayah: 50 },
  { surah: 17, ayah: 109 },
  { surah: 19, ayah: 58 },
  { surah: 22, ayah: 18 },
  { surah: 22, ayah: 77, note: "Counted as a sajdah of recitation by Shafi'i & Hanbali; Hanafi & Maliki do not." },
  { surah: 25, ayah: 60 },
  { surah: 27, ayah: 26 },
  { surah: 32, ayah: 15 },
  { surah: 38, ayah: 24, note: 'Recommended (Shafi/Maliki) sajdah of gratitude — Hanafi & Hanbali do not require it.' },
  { surah: 41, ayah: 38 },
  { surah: 53, ayah: 62 },
  { surah: 84, ayah: 21 },
  { surah: 96, ayah: 19 },
];

const sajdahKeySet = new Set(SAJDAH_VERSES.map((v) => `${v.surah}:${v.ayah}`));

export function isSajdahAyah(surah: number, ayah: number): boolean {
  return sajdahKeySet.has(`${surah}:${ayah}`);
}
