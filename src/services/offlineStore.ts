import * as FileSystem from 'expo-file-system/legacy';
import { captureError } from './sentry';

// Persistent on-device storage for Quran content — PROPER app storage, not a
// cache. Everything lives under the app's documentDirectory, which survives
// across launches and is never evicted by the OS (unlike a cache dir), and
// is NOT AsyncStorage — the old bulk-caching-into-AsyncStorage approach hit
// Android's ~6MB SQLite cap and broke every other write (SQLITE_FULL). The
// filesystem has no such cap.
//
// Layout:
//   <doc>/noor-offline/
//     manifest.json          progress + version
//     text/page_<n>.json     one Madinah-Mushaf page (verses + both scripts + both translations)
//     audio/<reciter>/<sss><aaa>.mp3   per-ayah recitation (Phase 2)

const ROOT = `${FileSystem.documentDirectory ?? ''}noor-offline/`;
const TEXT_DIR = `${ROOT}text/`;
const AUDIO_DIR = `${ROOT}audio/`;
const MANIFEST = `${ROOT}manifest.json`;

const OFFLINE_VERSION = 1;

export type OfflineManifest = {
  version: number;
  // Mushaf page numbers fully written to disk.
  pages: number[];
  // Map reciterId -> verse keys ("2:255") downloaded.
  audio: Record<string, string[]>;
};

let ensured = false;
async function ensureDirs(): Promise<void> {
  if (ensured) return;
  try {
    for (const dir of [ROOT, TEXT_DIR, AUDIO_DIR]) {
      const info = await FileSystem.getInfoAsync(dir);
      if (!info.exists) await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
    ensured = true;
  } catch (e) {
    captureError(e, { scope: 'offline:ensureDirs' });
  }
}

let manifestCache: OfflineManifest | null = null;

async function readManifest(): Promise<OfflineManifest> {
  if (manifestCache) return manifestCache;
  await ensureDirs();
  try {
    const info = await FileSystem.getInfoAsync(MANIFEST);
    if (info.exists) {
      const raw = await FileSystem.readAsStringAsync(MANIFEST);
      const parsed = JSON.parse(raw) as OfflineManifest;
      if (parsed && parsed.version === OFFLINE_VERSION) {
        manifestCache = {
          version: OFFLINE_VERSION,
          pages: Array.isArray(parsed.pages) ? parsed.pages : [],
          audio: parsed.audio && typeof parsed.audio === 'object' ? parsed.audio : {},
        };
        return manifestCache;
      }
    }
  } catch {
    // fall through to a fresh manifest
  }
  manifestCache = { version: OFFLINE_VERSION, pages: [], audio: {} };
  return manifestCache;
}

let writeChain: Promise<void> = Promise.resolve();
function persistManifest(m: OfflineManifest): Promise<void> {
  // Serialize writes so concurrent updates can't clobber each other.
  writeChain = writeChain
    .then(() => FileSystem.writeAsStringAsync(MANIFEST, JSON.stringify(m)))
    .catch((e) => captureError(e, { scope: 'offline:persistManifest' }));
  return writeChain;
}

// ── Text (Mushaf pages) ──────────────────────────────────────────────────

function pagePath(n: number): string {
  return `${TEXT_DIR}page_${n}.json`;
}

export async function hasOfflinePage(n: number): Promise<boolean> {
  await ensureDirs();
  try {
    const info = await FileSystem.getInfoAsync(pagePath(n));
    return info.exists;
  } catch {
    return false;
  }
}

export async function readOfflinePage<T>(n: number): Promise<T | null> {
  await ensureDirs();
  try {
    const info = await FileSystem.getInfoAsync(pagePath(n));
    if (!info.exists) return null;
    const raw = await FileSystem.readAsStringAsync(pagePath(n));
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function writeOfflinePage(n: number, content: unknown): Promise<void> {
  await ensureDirs();
  try {
    await FileSystem.writeAsStringAsync(pagePath(n), JSON.stringify(content));
    const m = await readManifest();
    if (!m.pages.includes(n)) {
      m.pages.push(n);
      await persistManifest(m);
    }
  } catch (e) {
    // Disk full / IO error — non-fatal; the page just isn't available offline.
    captureError(e, { scope: 'offline:writeOfflinePage' });
  }
}

// ── Audio (per-ayah, per-reciter) ────────────────────────────────────────

function audioPath(reciterFolder: string, fileName: string): string {
  return `${AUDIO_DIR}${reciterFolder}/${fileName}`;
}

export async function offlineAudioUri(reciterFolder: string, fileName: string): Promise<string | null> {
  await ensureDirs();
  try {
    const p = audioPath(reciterFolder, fileName);
    const info = await FileSystem.getInfoAsync(p);
    return info.exists ? p : null;
  } catch {
    return null;
  }
}

export async function downloadAudioFile(
  reciterFolder: string,
  fileName: string,
  remoteUrl: string,
): Promise<string | null> {
  await ensureDirs();
  const dir = `${AUDIO_DIR}${reciterFolder}/`;
  const dest = `${dir}${fileName}`;
  try {
    const dirInfo = await FileSystem.getInfoAsync(dir);
    if (!dirInfo.exists) await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    const existing = await FileSystem.getInfoAsync(dest);
    if (existing.exists) return dest;
    const res = await FileSystem.downloadAsync(remoteUrl, dest);
    if (res.status >= 200 && res.status < 300) return dest;
    // Failed download — remove any partial file so a retry starts clean.
    await FileSystem.deleteAsync(dest, { idempotent: true });
    return null;
  } catch (e) {
    captureError(e, { scope: 'offline:downloadAudio' });
    return null;
  }
}

// ── Progress / management ────────────────────────────────────────────────

export async function offlineTextProgress(total: number): Promise<{ done: number; total: number }> {
  const m = await readManifest();
  return { done: m.pages.length, total };
}

export async function clearOfflineContent(): Promise<void> {
  try {
    await FileSystem.deleteAsync(ROOT, { idempotent: true });
    manifestCache = null;
    ensured = false;
  } catch (e) {
    captureError(e, { scope: 'offline:clear' });
  }
}
