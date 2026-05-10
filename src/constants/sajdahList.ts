// Verses where the reader (and listener) is recommended to perform
// Sajdat al-Tilawah (the prostration of recitation). The classical schools
// agree on 14 of these in the Hafs an Asim recitation; some include
// Sad 38:24 as a 15th (sajdah of gratitude per Imam ash-Shafi'i).
//
// Sources: Sahih al-Bukhari (Book 19), Sahih Muslim (Book 5), and the
// standardized Madinah Mushaf legend (King Fahd Glorious Quran Printing
// Complex). The exact ayah marker (the ۩ symbol) is part of the Uthmani
// rasm and matches these references.
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
