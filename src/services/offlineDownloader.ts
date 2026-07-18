import { AppState, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { fetchPage, TOTAL_PAGES } from './quran';
import { SURAH_LIST } from '../constants/surahList';
import {
  hasOfflinePage,
  offlineTextProgress,
  downloadAudioFile,
  audioDownloadedCount,
  setAudioDownloadedCount,
} from './offlineStore';
import { captureError } from './sentry';

// Default reciter (matches RECITERS[0] in useAudioPlayer). Audio offline is
// built for this one reciter; others stay stream-only / on-demand.
// Exported so playback paths (AyahSheet, useAudioPlayer) can fall back to the
// one reciter guaranteed to be in the offline store.
export const DEFAULT_RECITER_FOLDER = 'Alafasy_128kbps';
const TOTAL_AYAHS = SURAH_LIST.reduce((n, s) => n + s.ayahs, 0); // 6236

// Progressive background downloader. While the app is foregrounded it walks
// the 604 Mushaf pages and persists each to the filesystem store, so the whole
// Quran (both scripts + both translations) becomes available offline without
// the user doing anything — and it RESUMES where it left off across launches
// (driven by what's already on disk, not an in-memory counter).
//
// Deliberately gentle: one page at a time with a gap between, paused the
// moment the app backgrounds. The full text is only ~18MB (604 pages), so it
// downloads on any connection; the much larger AUDIO download (Phase 2) is the
// one that will be WiFi-gated to stay Play-policy / user-data safe.

const GAP_MS = 600;          // breathing room between page fetches
const RETRY_GAP_MS = 5000;   // back off after a failed page before moving on

type Listener = (p: { done: number; total: number; running: boolean }) => void;

let running = false;
// Separate pause flags: backgrounding pauses both, but audio hitting a
// metered connection must NOT stop the (any-connection) text download.
let textStop = false;
let audioStop = false;
let started = false;
const listeners = new Set<Listener>();

async function emit(): Promise<void> {
  if (!listeners.size) return;
  const { done, total } = await offlineTextProgress(TOTAL_PAGES);
  listeners.forEach((l) => l({ done, total, running }));
}

export function subscribeOfflineProgress(l: Listener): () => void {
  listeners.add(l);
  emit();
  return () => listeners.delete(l);
}

async function isConnected(): Promise<boolean> {
  try {
    const s = await NetInfo.fetch();
    return s.isConnected === true;
  } catch {
    return true; // unknown → let the fetch itself decide
  }
}

async function runLoop(): Promise<void> {
  if (running) return;
  running = true;
  await emit();
  try {
    for (let page = 1; page <= TOTAL_PAGES; page++) {
      if (textStop) break;
      if (await hasOfflinePage(page)) continue;
      // Offline: park instead of walking all 604 pages through guaranteed
      // failures (which used to queue one Sentry error per page, ~50min of
      // churn per pass). The NetInfo listener re-kicks the loop on reconnect.
      if (!(await isConnected())) { textStop = true; break; }
      try {
        await fetchPage(page); // persists to the filesystem store
        await emit();
        await new Promise((r) => setTimeout(r, GAP_MS));
      } catch (e) {
        // Only report unexpected failures — a fetch dying because the network
        // just dropped is normal life, not a defect signal.
        if (await isConnected()) captureError(e, { scope: 'offline:download', page });
        await new Promise((r) => setTimeout(r, RETRY_GAP_MS));
      }
    }
  } finally {
    running = false;
    await emit();
  }
}

// ── Audio (default reciter, WiFi-gated) ──────────────────────────────────

let audioRunning = false;

async function onWifi(): Promise<boolean> {
  try {
    const s = await NetInfo.fetch();
    if (!s.isConnected) return false;
    if (s.type === 'wifi' || s.type === 'ethernet') return true;
    // Cross-platform metered signal — only download big audio when NOT expensive.
    return s.details && 'isConnectionExpensive' in s.details
      ? !s.details.isConnectionExpensive
      : false;
  } catch {
    return false;
  }
}

async function audioLoop(): Promise<void> {
  if (audioRunning) return;
  audioRunning = true;
  try {
    let done = await audioDownloadedCount(DEFAULT_RECITER_FOLDER);
    let sinceFlush = 0;
    for (const surah of SURAH_LIST) {
      if (audioStop) break;
      for (let ayah = 1; ayah <= surah.ayahs; ayah++) {
        if (audioStop) break;
        // Recitation is hundreds of MB — only ever fetch on an unmetered
        // connection so we never burn a user's mobile data (Play-safe).
        if (!(await onWifi())) { audioStop = true; break; }
        const file = `${String(surah.number).padStart(3, '0')}${String(ayah).padStart(3, '0')}.mp3`;
        const url = `https://everyayah.com/data/${DEFAULT_RECITER_FOLDER}/${file}`;
        const r = await downloadAudioFile(DEFAULT_RECITER_FOLDER, file, url);
        if (r === 'downloaded') {
          done += 1;
          if (++sinceFlush >= 20) { sinceFlush = 0; await setAudioDownloadedCount(DEFAULT_RECITER_FOLDER, done); }
          await emitAudio(done);
          await new Promise((res) => setTimeout(res, 150));
        }
        // 'exists' (resume) and 'failed' just move on — no throttle needed.
      }
    }
    await setAudioDownloadedCount(DEFAULT_RECITER_FOLDER, done);
    await emitAudio(done);
  } finally {
    audioRunning = false;
  }
}

const audioListeners = new Set<(p: { done: number; total: number }) => void>();
async function emitAudio(done?: number): Promise<void> {
  if (!audioListeners.size) return;
  const d = done ?? (await audioDownloadedCount(DEFAULT_RECITER_FOLDER));
  audioListeners.forEach((l) => l({ done: d, total: TOTAL_AYAHS }));
}
export function subscribeAudioProgress(l: (p: { done: number; total: number }) => void): () => void {
  audioListeners.add(l);
  emitAudio();
  return () => audioListeners.delete(l);
}

/**
 * Start (or resume) the background download. Idempotent — safe to call on every
 * app start. Pauses when the app backgrounds and resumes when it returns. Text
 * downloads on any connection (~18MB); audio is WiFi-gated (~hundreds of MB).
 */
export function startOfflineDownload(): void {
  if (started) return;
  started = true;

  const kick = () => {
    textStop = false;
    audioStop = false;
    runLoop().catch((e) => captureError(e, { scope: 'offline:runLoop' }));
    audioLoop().catch((e) => captureError(e, { scope: 'offline:audioLoop' }));
  };

  const onState = (state: AppStateStatus) => {
    if (state === 'active') kick();
    else { textStop = true; audioStop = true; } // pause both on background
  };
  AppState.addEventListener('change', onState);

  // Opportunistic resume: the moment connectivity returns (or the connection
  // becomes unmetered, un-parking the WiFi-gated audio loop), pick the
  // download back up — even if the user never backgrounds the app.
  NetInfo.addEventListener((state) => {
    if (state.isConnected && AppState.currentState === 'active') kick();
  });

  // First run shortly after launch so it never competes with cold-start work.
  setTimeout(kick, 8000);
}

// Back-compat alias for the App.tsx call site.
export const startOfflineTextDownload = startOfflineDownload;
