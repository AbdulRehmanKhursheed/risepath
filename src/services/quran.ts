import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE = 'https://api.alquran.cloud/v1';
const CACHE_PREFIX = 'quran_surah_';

export type Ayah = {
  numberInSurah: number;
  arabic: string;
  english: string;
  urdu: string;
};

export type SurahContent = {
  number: number;
  ayahs: Ayah[];
  fetchedAt: number;
};

// Cache for 7 days — Quran content never changes
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type ApiEditionData = {
  ayahs: { numberInSurah: number; text: string }[];
};

export async function fetchSurah(surahNumber: number): Promise<SurahContent> {
  const cacheKey = `${CACHE_PREFIX}${surahNumber}`;

  // Try cache first
  const cached = await AsyncStorage.getItem(cacheKey);
  if (cached) {
    const parsed: SurahContent = JSON.parse(cached);
    if (Date.now() - parsed.fetchedAt < CACHE_TTL_MS) {
      return parsed;
    }
  }

  // Fetch Arabic + English + Urdu in one request
  const url = `${BASE}/surah/${surahNumber}/editions/quran-uthmani,en.sahih,ur.maududi`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch surah ${surahNumber}`);

  const json = await res.json();
  const editions: ApiEditionData[] = json.data;

  const arabic = editions[0];
  const english = editions[1];
  const urdu = editions[2];

  const ayahs: Ayah[] = arabic.ayahs.map((a, idx) => ({
    numberInSurah: a.numberInSurah,
    arabic: a.text,
    english: english.ayahs[idx]?.text ?? '',
    urdu: urdu.ayahs[idx]?.text ?? '',
  }));

  const content: SurahContent = {
    number: surahNumber,
    ayahs,
    fetchedAt: Date.now(),
  };

  // Save to cache
  await AsyncStorage.setItem(cacheKey, JSON.stringify(content));
  return content;
}
