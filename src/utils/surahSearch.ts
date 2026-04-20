import { SurahMeta } from '../constants/surahList';

// Arabic combining diacritics (tashkeel) + superscript alef.
const ARABIC_DIACRITICS = /[\u064B-\u065F\u0670]/g;

// Only for names not covered by the generic phonetic rules below (oo→u, etc).
const SURAH_ALIASES: Record<number, string[]> = {
  18: ['kahaf'],                     // Al-Kahf
  36: ['yaseen', 'yasin', 'yaasin'], // Ya-Sin
  55: ['rehman', 'rahman'],          // Ar-Rahman
  67: ['mulk'],                      // Al-Mulk
  78: ['naba'],                      // An-Naba
  75: ['qiyamat', 'qiyamah'],        // Al-Qiyamah
  76: ['dahr', 'insan'],             // Al-Insan
  56: ['waqiah', 'waqia'],           // Al-Waqi'ah
  112: ['ikhlas'],                   // Al-Ikhlas
  113: ['falaq'],                    // Al-Falaq
  114: ['nas', 'naas'],              // An-Nas
  109: ['kafirun'],                  // Al-Kafirun
  110: ['nasr'],                     // An-Nasr
  93: ['duha'],                      // Ad-Duha
  94: ['sharh', 'inshirah'],         // Ash-Sharh
  97: ['qadr'],                      // Al-Qadr
};

function normalize(raw: string): string {
  if (!raw) return '';
  let s = raw.toLowerCase().trim();

  // Arabic/Urdu normalization.
  s = s.replace(ARABIC_DIACRITICS, '');
  s = s.replace(/[أإآٱ]/g, 'ا');   // hamza variants → alef
  s = s.replace(/ى/g, 'ي');         // alef maksura → ya
  s = s.replace(/[ةۃ]/g, 'ه');     // taa marbuta → ha
  s = s.replace(/ہ/g, 'ه');         // Urdu heh → Arabic heh
  s = s.replace(/ی/g, 'ي');         // Urdu ya → Arabic ya
  s = s.replace(/ک/g, 'ك');         // Urdu kaf → Arabic kaf

  // Strip punctuation (hyphens, apostrophes, quotes, etc.).
  s = s.replace(/[''‘’`\-–—.,"():؛،]/g, '');

  // Strip leading definite-article transliterations ("Al-", "An-", "Ar-" …).
  s = s.replace(/^(al|an|ar|as|ash|at|az|adh|ad|ath)\s*/i, '');

  // Collapse whitespace.
  s = s.replace(/\s+/g, '');

  // Common Urdu→Arabic transliteration collapses.
  s = s.replace(/oo/g, 'u');
  s = s.replace(/ee/g, 'i');
  s = s.replace(/aa/g, 'a');
  s = s.replace(/ii/g, 'i');

  return s;
}

export function matchesSurah(s: SurahMeta, query: string): boolean {
  const q = normalize(query);
  if (!q) return true;

  const haystacks: string[] = [
    normalize(s.nameEnglish),
    normalize(s.nameArabic),
    normalize(s.nameUrdu),
    normalize(s.meaning),
    String(s.number),
    ...(SURAH_ALIASES[s.number] ?? []).map(normalize),
  ];

  return haystacks.some((h) => h.includes(q));
}
