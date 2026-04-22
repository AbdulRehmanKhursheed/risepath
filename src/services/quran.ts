import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE = 'https://api.alquran.cloud/v1';
const CACHE_PREFIX = 'quran_surah_';
const CACHE_VERSION = 2;
const CACHE_VERSION_KEY = 'quran_cache_version';

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

type ApiEditionData = {
  ayahs: { numberInSurah: number; text: string }[];
};

const inflight = new Map<number, Promise<SurahContent>>();

function cacheKey(n: number): string {
  return `${CACHE_PREFIX}${n}`;
}

async function readCache(n: number): Promise<SurahContent | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(n));
    if (!raw) return null;
    return JSON.parse(raw) as SurahContent;
  } catch {
    return null;
  }
}

async function writeCache(content: SurahContent): Promise<void> {
  try {
    await AsyncStorage.setItem(cacheKey(content.number), JSON.stringify(content));
  } catch {
    // Storage may be full on Android (6MB default). Non-fatal; next open refetches.
  }
}

async function fetchFromNetwork(surahNumber: number): Promise<SurahContent> {
  const url = `${BASE}/surah/${surahNumber}/editions/quran-uthmani,en.sahih,ur.maududi`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch surah ${surahNumber}`);

  const json = await res.json();
  const editions: ApiEditionData[] = json.data;
  if (!Array.isArray(editions) || editions.length < 3) {
    throw new Error(`Unexpected API response for surah ${surahNumber}`);
  }

  const arabic = editions[0];
  const english = editions[1];
  const urdu = editions[2];

  const ayahs: Ayah[] = arabic.ayahs.map((a, idx) => ({
    numberInSurah: a.numberInSurah,
    arabic: a.text,
    english: english.ayahs[idx]?.text ?? '',
    urdu: urdu.ayahs[idx]?.text ?? '',
  }));

  return {
    number: surahNumber,
    ayahs,
    fetchedAt: Date.now(),
  };
}

export async function fetchSurah(surahNumber: number): Promise<SurahContent> {
  const cached = await readCache(surahNumber);
  if (cached && cached.ayahs && cached.ayahs.length > 0) return cached;

  const existing = inflight.get(surahNumber);
  if (existing) return existing;

  const p = (async () => {
    try {
      const content = await fetchFromNetwork(surahNumber);
      await writeCache(content);
      return content;
    } finally {
      inflight.delete(surahNumber);
    }
  })();

  inflight.set(surahNumber, p);
  return p;
}

const TAJWEED_PREFIX = 'quran_tajweed_';

export async function fetchTajweedTexts(surahNumber: number): Promise<string[]> {
  const key = `${TAJWEED_PREFIX}${surahNumber}`;
  try {
    const cached = await AsyncStorage.getItem(key);
    if (cached) return JSON.parse(cached) as string[];
  } catch {}

  const url = `${BASE}/surah/${surahNumber}/editions/quran-tajweed`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Tajweed fetch failed for surah ${surahNumber}`);
  const json = await res.json();
  const edition = Array.isArray(json.data) ? json.data[0] : json.data;
  const texts: string[] = (edition.ayahs as { text: string }[]).map(a => a.text);
  try {
    await AsyncStorage.setItem(key, JSON.stringify(texts));
  } catch {}
  return texts;
}

export async function hasCachedSurah(surahNumber: number): Promise<boolean> {
  const c = await readCache(surahNumber);
  return !!(c && c.ayahs && c.ayahs.length > 0);
}

export function prefetchSurah(surahNumber: number): void {
  fetchSurah(surahNumber).catch(() => {});
}

export function prefetchAdjacent(surahNumber: number): void {
  if (surahNumber > 1) prefetchSurah(surahNumber - 1);
  if (surahNumber < 114) prefetchSurah(surahNumber + 1);
}

// Short, popular surahs first so the user's likely-next reads hit cache
// immediately — the rest trickle in during idle time.
const PRIORITY_ORDER: number[] = [
  1,   // Fatiha
  36,  // Yasin
  18,  // Kahf
  67,  // Mulk
  55,  // Rahman
  56,  // Waqiah
  112, // Ikhlas
  113, // Falaq
  114, // Nas
  2,   // Baqarah
  3,   // Al-Imran
  4,   // Nisa
  5,   // Maidah
  32,  // Sajdah
  48,  // Fath
  78,  // Naba
];

function buildPrefetchOrder(): number[] {
  const seen = new Set<number>();
  const order: number[] = [];
  for (const n of PRIORITY_ORDER) {
    if (!seen.has(n)) { seen.add(n); order.push(n); }
  }
  for (let n = 1; n <= 114; n++) {
    if (!seen.has(n)) { seen.add(n); order.push(n); }
  }
  return order;
}

let allPrefetchStarted = false;

export async function prefetchAllSurahs(options?: { gapMs?: number }): Promise<void> {
  if (allPrefetchStarted) return;
  allPrefetchStarted = true;

  try {
    const storedVersion = await AsyncStorage.getItem(CACHE_VERSION_KEY);
    if (storedVersion !== String(CACHE_VERSION)) {
      await AsyncStorage.setItem(CACHE_VERSION_KEY, String(CACHE_VERSION));
    }
  } catch {
    // ignore
  }

  const gap = options?.gapMs ?? 200;
  const order = buildPrefetchOrder();

  for (const n of order) {
    if (await hasCachedSurah(n)) continue;
    try {
      await fetchSurah(n);
    } catch {
      // A single failure shouldn't abort the trickle — try the next.
    }
    await new Promise((r) => setTimeout(r, gap));
  }
}
