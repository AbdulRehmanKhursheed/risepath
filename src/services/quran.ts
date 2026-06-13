import AsyncStorage from '@react-native-async-storage/async-storage';
import { readOfflinePage, writeOfflinePage, readOfflineSurah, writeOfflineSurah } from './offlineStore';

const BASE = 'https://api.alquran.cloud/v1';
// v3: strips the Bismillah alquran.cloud embeds in ayah 1 (it duplicated the
// reader's own Bismillah header) and refuses to cache translation-less
// responses — older caches may contain either, so they're invalidated.
const CACHE_VERSION = 3;
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

// RN Android's fetch has effectively no timeout, and every loader here dedupes
// through an inflight map — so one hung request used to pin "Loading…" forever
// (reopening the surah just joined the same stuck promise). The abort guarantees
// every promise settles, which is what lets the inflight maps clear and a
// retry issue a genuinely new request.
const FETCH_TIMEOUT_MS = 15_000;

async function fetchWithTimeout(url: string): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchJsonWithRetry(url: string): Promise<any> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetchWithTimeout(url);
      if (!res.ok) {
        // 4xx is permanent — retrying just doubles the wait for the same
        // answer (and stacked the worst case to ~31.5s before the error UI).
        if (res.status >= 400 && res.status < 500) {
          const err = new Error(`HTTP ${res.status} for ${url}`);
          (err as Error & { permanent?: boolean }).permanent = true;
          throw err;
        }
        throw new Error(`HTTP ${res.status} for ${url}`);
      }
      return await res.json();
    } catch (e) {
      if ((e as Error & { permanent?: boolean })?.permanent) throw e;
      lastErr = e;
      if (attempt === 0) await new Promise((r) => setTimeout(r, 1500));
    }
  }
  throw lastErr;
}

// alquran.cloud's quran-uthmani edition embeds the Bismillah in ayah 1 of
// every surah except 9 (and 1:1 IS the Bismillah, prefixed with a BOM).
// The reader renders its own Bismillah header, so the embedded copy showed
// it twice. Matching must be mark-tolerant, NOT byte equality: the wire
// text carries combining marks in non-NFC order (shadda before fatha) and
// surahs 95/97 even add an extra shadda on the ba — a literal startsWith
// silently never matched. The regex matches the base-letter skeleton and
// skips any harakat/Quranic annotation marks between them. Validated
// against ayah 1 of all 114 surahs from the live API: strips 112/112, no
// match on surah 9, and surah 1 (where the whole ayah IS the Bismillah)
// is kept by the empty-result guard.
const MARKS = '[\\u064B-\\u065F\\u0670\\u06D6-\\u06ED]*';
const EMBEDDED_BISMILLAH_RE = new RegExp(
  '^\\uFEFF?' +
  '\u0628' + MARKS + '\u0633' + MARKS + '\u0645' + MARKS + ' +' +
  '\u0671' + MARKS + '\u0644' + MARKS + '\u0644' + MARKS + '\u0647' + MARKS + ' +' +
  '\u0671' + MARKS + '\u0644' + MARKS + '\u0631' + MARKS + '\u062D' + MARKS + '\u0645' + MARKS + '\u0646' + MARKS + ' +' +
  '\u0671' + MARKS + '\u0644' + MARKS + '\u0631' + MARKS + '\u062D' + MARKS + '\u064A' + MARKS + '\u0645' + MARKS + ' *'
);

export function stripEmbeddedBismillah(text: string, surahNumber: number, idx: number): string {
  const t = text.replace(/^\uFEFF/, '');
  if (idx !== 0 || surahNumber === 1 || surahNumber === 9) return t;
  const m = EMBEDDED_BISMILLAH_RE.exec(t);
  if (m) {
    const rest = t.slice(m[0].length).trim();
    return rest.length > 0 ? rest : t;
  }
  return t;
}

function cacheKey(n: number): string {
  return `${CACHE_PREFIX}${n}`;
}

async function readCache(n: number): Promise<SurahContent | null> {
  // Persistent filesystem store (proper offline storage) — surah content is no
  // longer kept in AsyncStorage, which capped at ~6MB (SQLITE_FULL). A surah
  // opened online is saved here so it reads offline next time.
  const parsed = await readOfflineSurah<SurahContent>(n);
  if (!parsed) return null;
  // Self-heal: entries saved while the Bismillah strip was broken still carry
  // the embedded copy in ayah 1 — strip on read so they fix themselves.
  if (parsed?.ayahs?.[0]) {
    parsed.ayahs[0] = {
      ...parsed.ayahs[0],
      arabic: stripEmbeddedBismillah(parsed.ayahs[0].arabic, n, 0),
    };
  }
  return parsed;
}

async function writeCache(content: SurahContent): Promise<void> {
  await writeOfflineSurah(content.number, content);
}

async function fetchFromNetwork(surahNumber: number): Promise<SurahContent> {
  const url = `${BASE}/surah/${surahNumber}/editions/quran-uthmani,en.sahih,ur.maududi`;
  const json = await fetchJsonWithRetry(url);
  const editions: ApiEditionData[] = json.data;
  if (!Array.isArray(editions) || editions.length < 3) {
    throw new Error(`Unexpected API response for surah ${surahNumber}`);
  }

  const arabic = editions[0];
  const english = editions[1];
  const urdu = editions[2];

  const ayahs: Ayah[] = arabic.ayahs.map((a, idx) => ({
    numberInSurah: a.numberInSurah,
    arabic: stripEmbeddedBismillah(a.text, surahNumber, idx),
    english: english.ayahs[idx]?.text ?? '',
    urdu: urdu.ayahs[idx]?.text ?? '',
  }));

  // A response with Arabic but blank translations would otherwise be cached
  // and shown translation-less forever (the cache check only counted ayahs).
  if (ayahs.length === 0 || ayahs.every((a) => !a.english && !a.urdu)) {
    throw new Error(`Surah ${surahNumber} response missing translations`);
  }

  return {
    number: surahNumber,
    ayahs,
    fetchedAt: Date.now(),
  };
}

export async function fetchSurah(surahNumber: number): Promise<SurahContent> {
  const cached = await readCache(surahNumber);
  if (
    cached &&
    cached.ayahs &&
    cached.ayahs.length > 0 &&
    // Translation-less entries (from interrupted/partial responses) must
    // refetch rather than render a permanently translation-less surah.
    cached.ayahs.some((a) => a.english || a.urdu)
  ) {
    return cached;
  }

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

// Offline-safe variant. Returns null on network failure with no cache.
// Callers render an "offline / cached only" UI instead of crashing.
export async function fetchSurahSafe(surahNumber: number): Promise<SurahContent | null> {
  try {
    return await fetchSurah(surahNumber);
  } catch {
    return null;
  }
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

  // Persistent filesystem store first (proper offline app storage). Pages are
  // no longer written to AsyncStorage — bulk page JSON there hit Android's
  // ~6MB SQLite cap (SQLITE_FULL) and broke other writes. The filesystem has
  // no such cap, so a fully-downloaded Mushaf lives there permanently.
  const offline = await readOfflinePage<PageContent>(pageNumber);
  if (offline?.verses?.length) return offline;

  const existing = pageInflight.get(pageNumber);
  if (existing) return existing;

  const p = (async () => {
    try {
      const url =
        `${PAGE_API}/${pageNumber}` +
        `?fields=text_uthmani,text_indopak,juz_number,hizb_number,page_number` +
        `&translations=${TRANSLATION_EN_ID},${TRANSLATION_UR_ID}` +
        `&per_page=50`;
      const json = await fetchJsonWithRetry(url);
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
      await writeOfflinePage(pageNumber, content);
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

// Offline-safe variant. Returns null on network failure with no cache so
// the page reader can show an offline banner instead of a blank screen.
export async function fetchPageSafe(pageNumber: number): Promise<PageContent | null> {
  try {
    return await fetchPage(pageNumber);
  } catch {
    return null;
  }
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
      const json = await fetchJsonWithRetry(url);
      const verses = (json.verses ?? []) as { text_indopak: string }[];
      const texts: string[] = verses.map((v) => v.text_indopak ?? '');
      try {
        await AsyncStorage.setItem(key, JSON.stringify(texts));
      } catch {}
      return texts;
    } catch {
      // Offline + no cache: return empty so the reader falls back to the
      // Uthmani text from fetchSurah/fetchPage instead of crashing.
      return [];
    } finally {
      indopakInflight.delete(surahNumber);
    }
  })();

  indopakInflight.set(surahNumber, p);
  return p;
}

const tajweedInflight = new Map<number, Promise<string[]>>();

export async function fetchTajweedTexts(surahNumber: number): Promise<string[]> {
  const key = `${TAJWEED_PREFIX}${surahNumber}`;
  try {
    const cached = await AsyncStorage.getItem(key);
    if (cached) {
      const parsed = JSON.parse(cached) as string[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}

  const existing = tajweedInflight.get(surahNumber);
  if (existing) return existing;

  const p = (async () => {
    try {
      const url = `${TAJWEED_API}?chapter_number=${surahNumber}`;
      const json = await fetchJsonWithRetry(url);
      const verses = (json.verses ?? []) as { text_uthmani_tajweed: string }[];
      const texts: string[] = verses.map((v) => v.text_uthmani_tajweed ?? '');
      try {
        await AsyncStorage.setItem(key, JSON.stringify(texts));
      } catch {}
      return texts;
    } catch {
      // Offline + no cache: return empty so the reader falls back to plain
      // Arabic without tajweed coloring instead of crashing.
      return [];
    } finally {
      tajweedInflight.delete(surahNumber);
    }
  })();

  tajweedInflight.set(surahNumber, p);
  return p;
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

// Disabled. The previous behavior — trickle-prefetching every surah at
// app start — was filling AsyncStorage past Android's 6 MB SQLite cap
// (114 surahs × 3 editions ≈ 5–6 MB), which then caused EVERY OTHER
// write in the app (streak, goals, prayer marks, hijri offset) to fail
// with SQLITE_FULL. Cache is now strictly on-demand: a surah is fetched
// + cached only when the user opens it, and the cap is unlikely to be
// reached unless the user reads dozens of surahs.
//
// Kept exported with the same signature so the App.tsx call site can
// stay unchanged for now.
export async function prefetchAllSurahs(_options?: { gapMs?: number }): Promise<void> {
  if (allPrefetchStarted) return;
  allPrefetchStarted = true;
  return;
}

// One-shot migration: delete every cached surah JSON from AsyncStorage to
// reclaim space for the rest of the app. Idempotent; tracked by a flag so
// it only runs once per install. Safe to call early in app startup — runs
// in the background and does not block the UI. Surahs the user opens
// after this point are refetched on demand and cached individually.
const PURGE_FLAG_KEY = 'quran_cache_purged_v1';

// Old-version cache entries become unreadable garbage after a CACHE_VERSION
// bump (the key prefix changes), and the one-shot bulk purge above has
// already run on existing installs — so without this, superseded
// quran_surah_v2_*/quran_page_v1_* blobs squat in the 6MB SQLite budget
// forever. Versioned flag: re-runs once after every CACHE_VERSION bump.
const ORPHAN_PURGE_FLAG_KEY = `quran_orphan_purge_for_v${CACHE_VERSION}`;

async function purgeOrphanedVersions(): Promise<void> {
  try {
    const done = await AsyncStorage.getItem(ORPHAN_PURGE_FLAG_KEY);
    if (done === '1') return;
    const allKeys = await AsyncStorage.getAllKeys();
    const orphaned = allKeys.filter((k) => {
      const surah = /^quran_surah_v(\d+)_/.exec(k);
      if (surah) return Number(surah[1]) !== CACHE_VERSION;
      const page = /^quran_page_v(\d+)_/.exec(k);
      if (page) return `quran_page_v${page[1]}_` !== PAGE_PREFIX;
      const taj = /^quran_tajweed_v(\d+)_/.exec(k);
      if (taj) return `quran_tajweed_v${taj[1]}_` !== TAJWEED_PREFIX;
      return false;
    });
    if (orphaned.length > 0) {
      await AsyncStorage.multiRemove(orphaned);
    }
    await AsyncStorage.setItem(ORPHAN_PURGE_FLAG_KEY, '1');
  } catch {
    // Flag stays unset → retried next launch.
  }
}

export async function purgeQuranCacheOnce(): Promise<void> {
  await purgeOrphanedVersions();
  try {
    const done = await AsyncStorage.getItem(PURGE_FLAG_KEY);
    if (done === '1') return;
    const allKeys = await AsyncStorage.getAllKeys();
    const cacheKeys = allKeys.filter(
      (k) =>
        k.startsWith(CACHE_PREFIX) ||
        k.startsWith(INDOPAK_PREFIX) ||
        k.startsWith('quran_page_v'),
    );
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
    }
    await AsyncStorage.setItem(PURGE_FLAG_KEY, '1');
  } catch {
    // If the purge itself fails (rare), leave the flag unset so we
    // retry next launch. Either way the app remains functional.
  }
}
