import { AppState, AppStateStatus } from 'react-native';
import { fetchPage, TOTAL_PAGES } from './quran';
import { hasOfflinePage, offlineTextProgress } from './offlineStore';
import { captureError } from './sentry';

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
let stopRequested = false;
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

async function runLoop(): Promise<void> {
  if (running) return;
  running = true;
  stopRequested = false;
  await emit();
  try {
    for (let page = 1; page <= TOTAL_PAGES; page++) {
      if (stopRequested) break;
      if (await hasOfflinePage(page)) continue;
      try {
        await fetchPage(page); // persists to the filesystem store
        await emit();
        await new Promise((r) => setTimeout(r, GAP_MS));
      } catch (e) {
        captureError(e, { scope: 'offline:download', page });
        await new Promise((r) => setTimeout(r, RETRY_GAP_MS));
      }
    }
  } finally {
    running = false;
    await emit();
  }
}

/**
 * Start (or resume) the background download. Idempotent — safe to call on every
 * app start. Pauses when the app backgrounds and resumes when it returns.
 */
export function startOfflineTextDownload(): void {
  if (started) return;
  started = true;

  const kick = () => { runLoop().catch((e) => captureError(e, { scope: 'offline:runLoop' })); };

  const onState = (state: AppStateStatus) => {
    if (state === 'active') kick();
    else stopRequested = true; // pause politely; the for-loop checks this
  };
  AppState.addEventListener('change', onState);

  // First run shortly after launch so it never competes with cold-start work.
  setTimeout(kick, 8000);
}
