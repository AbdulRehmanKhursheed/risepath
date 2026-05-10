import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE = 'https://api.alquran.cloud/v1';
const CACHE_VERSION = 2;
const CACHE_PREFIX = `quran_surah_v${CACHE_VERSION}_`;
const CACHE_VERSION_KEY = 'quran_cache_version';

// IndoPak text comes from Quran.com (alquran.cloud has no IndoPak edition).
// Cached separately so a user toggling Reading Style doesn't re-pay network.
const INDOPAK_PREFIX = 'quran_surah_indopak_v1_';
const INDOPAK_API = 'https://api.quran.com/api/v4/quran/verses/indopak';

export type QuranScript = 'uthmani' | 'indopak';

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

// Cache key prefix versioned: previous releases used alquran.cloud's
// `quran-tajweed` edition, which returns Tanzil-style bracket markup
// (e.g. "[h:1[ٱ]") that our parser cannot read. We now use Quran.com's
// `uthmani_tajweed` edition, which returns proper HTML <tajweed class=X>
// tags. The version bump ensures any stale bracket-format cache is ignored.
const TAJWEED_PREFIX = 'quran_tajweed_v2_';
const TAJWEED_API = 'https://api.quran.com/api/v4/quran/verses/uthmani_tajweed';

const indopakInflight = new Map<number, Promise<string[]>>();

// Page-based fetch — used by the 604-page Mushaf reader. Pulls all verses
// on a given Madinah-Mushaf page with both scripts AND both translations
// (Sahih International English + Maududi Tafheem Urdu) in a single request,
// plus the juz/hizb numbers needed for the page footer.
//
// v2 cache: bumped to invalidate v1 entries that lack translations.
const PAGE_PREFIX = 'quran_page_v2_';
const PAGE_API = 'https://api.quran.com/api/v4/verses/by_page';
export const TOTAL_PAGES = 604;

// Quran.com translation IDs. Picked to match what the existing surah reader
// uses (Sahih English + Maududi Urdu) so the user sees the same translator
// across both reading surfaces.
const TRANSLATION_EN_ID = 131;  // Saheeh International
const TRANSLATION_UR_ID = 97;   // Tafheem-ul-Qur'an (Maududi)

export type PageVerse = {
  verseKey: string;       // e.g. "2:142"
  surahNumber: number;
  ayahNumber: number;
  textUthmani: string;
  textIndopak: string;
  translationEn: string;
  translationUr: string;
  juzNumber: number;
  hizbNumber: number;
  pageNumber: number;
};

export type PageContent = {
  pageNumber: number;
  verses: PageVerse[];
  juzNumber: number;       // juz of the first verse on this page
  fetchedAt: number;
};

function stripTranslationHtml(s: string): string {
  // Quran.com translations occasionally include <sup>, <i>, footnote markers.
  // Strip tags so the bottom sheet shows clean prose.
  return s
    .replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .trim();
}

const pageInflight = new Map<number, Promise<PageContent>>();

export async function fetchPage(pageNumber: number): Promise<PageContent> {
  if (pageNumber < 1 || pageNumber > TOTAL_PAGES) {
    throw new Error(`Page ${pageNumber} out of range`);
  }

  const key = `${PAGE_PREFIX}${pageNumber}`;
  try {
    const cached = await AsyncStorage.getItem(key);
    if (cached) {
      const parsed = JSON.parse(cached) as PageContent;
      if (parsed?.verses?.length > 0) return parsed;
    }
  } catch {}

  const existing = pageInflight.get(pageNumber);
  if (existing) return existing;

  const p = (async () => {
    try {
      const url =
        `${PAGE_API}/${pageNumber}` +
        `?fields=text_uthmani,text_indopak,juz_number,hizb_number,page_number` +
        `&translations=${TRANSLATION_EN_ID},${TRANSLATION_UR_ID}` +
        `&per_page=50`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Page ${pageNumber} fetch failed`);
      const json = await res.json();
      const raw = (json.verses ?? []) as Array<{
        verse_key: string;
        text_uthmani: string;
        text_indopak: string;
        juz_number: number;
        hizb_number: number;
        page_number: number;
        translations?: Array<{ resource_id: number; text: string }>;
      }>;
      const verses: PageVerse[] = raw.map((v) => {
        const [s, a] = v.verse_key.split(':').map(Number);
        const tEn =
          v.translations?.find((t) => t.resource_id === TRANSLATION_EN_ID)?.text ?? '';
        const tUr =
          v.translations?.find((t) => t.resource_id === TRANSLATION_UR_ID)?.text ?? '';
        return {
          verseKey: v.verse_key,
          surahNumber: s,
          ayahNumber: a,
          textUthmani: v.text_uthmani ?? '',
          textIndopak: v.text_indopak ?? '',
          translationEn: stripTranslationHtml(tEn),
          translationUr: stripTranslationHtml(tUr),
          juzNumber: v.juz_number,
          hizbNumber: v.hizb_number,
          pageNumber: v.page_number,
        };
      });
      const content: PageContent = {
        pageNumber,
        verses,
        juzNumber: verses[0]?.juzNumber ?? 1,
        fetchedAt: Date.now(),
      };
      try {
        await AsyncStorage.setItem(key, JSON.stringify(content));
      } catch {}
      return content;
    } finally {
      pageInflight.delete(pageNumber);
    }
  })();

  pageInflight.set(pageNumber, p);
  return p;
}

export function prefetchPage(pageNumber: number): void {
  if (pageNumber < 1 || pageNumber > TOTAL_PAGES) return;
  fetchPage(pageNumber).catch(() => {});
}

export function prefetchAdjacentPages(pageNumber: number): void {
  prefetchPage(pageNumber - 1);
  prefetchPage(pageNumber + 1);
}

// Unified last-read state — one record across every reader. Whichever reader
// the user touched most recently wins; the Quran landing shows a single
// prominent "Continue Reading" card backed by this value.
export type LastRead =
  | { type: 'page';  value: number; ts: number }
  | { type: 'surah'; value: number; ts: number };

const LAST_READ_KEY = 'quran_last_read_v2';

// Legacy juz-typed records (from before Juz was removed) are migrated to a
// page resume using the juz's starting page, so existing users don't lose
// their Continue-Reading card.
import { JUZ_START_PAGE } from '../constants/juzList';

export async function saveLastRead(
  partial: { type: LastRead['type']; value: number }
): Promise<void> {
  try {
    const lr: LastRead = { ...partial, ts: Date.now() } as LastRead;
    await AsyncStorage.setItem(LAST_READ_KEY, JSON.stringify(lr));
  } catch {
    // non-fatal; the resume card just won't appear until next session.
  }
}

export async function loadLastRead(): Promise<LastRead | null> {
  try {
    const raw = await AsyncStorage.getItem(LAST_READ_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { type: string; value: number; ts: number };
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.value !== 'number') return null;
    if (parsed.type === 'page' || parsed.type === 'surah') {
      return parsed as LastRead;
    }
    if (parsed.type === 'juz') {
      const startPage = JUZ_START_PAGE[parsed.value];
      if (!startPage) return null;
      return { type: 'page', value: startPage, ts: parsed.ts };
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchIndopakTexts(surahNumber: number): Promise<string[]> {
  const key = `${INDOPAK_PREFIX}${surahNumber}`;
  try {
    const cached = await AsyncStorage.getItem(key);
    if (cached) {
      const parsed = JSON.parse(cached) as string[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}

  const existing = indopakInflight.get(surahNumber);
  if (existing) return existing;

  const p = (async () => {
    try {
      const url = `${INDOPAK_API}?chapter_number=${surahNumber}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`IndoPak fetch failed for surah ${surahNumber}`);
      const json = await res.json();
      const verses = (json.verses ?? []) as { text_indopak: string }[];
      const texts: string[] = verses.map((v) => v.text_indopak ?? '');
      try {
        await AsyncStorage.setItem(key, JSON.stringify(texts));
      } catch {}
      return texts;
    } finally {
      indopakInflight.delete(surahNumber);
    }
  })();

  indopakInflight.set(surahNumber, p);
  return p;
}

export async function fetchTajweedTexts(surahNumber: number): Promise<string[]> {
  const key = `${TAJWEED_PREFIX}${surahNumber}`;
  try {
    const cached = await AsyncStorage.getItem(key);
    if (cached) return JSON.parse(cached) as string[];
  } catch {}

  const url = `${TAJWEED_API}?chapter_number=${surahNumber}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Tajweed fetch failed for surah ${surahNumber}`);
  const json = await res.json();
  const verses = (json.verses ?? []) as { text_uthmani_tajweed: string }[];
  const texts: string[] = verses.map((v) => v.text_uthmani_tajweed ?? '');
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
