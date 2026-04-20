import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';

const OPENS_KEY = 'review_app_opens';
const ASKED_KEY = 'review_prompted_at';
const MIN_OPENS_BEFORE_PROMPT = 8;
const COOLDOWN_MS = 90 * 24 * 60 * 60 * 1000;

export async function trackAppOpen(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(OPENS_KEY);
    const n = raw ? parseInt(raw, 10) : 0;
    await AsyncStorage.setItem(OPENS_KEY, String(n + 1));
  } catch {
    // ignore
  }
}

export async function maybePromptReview(): Promise<void> {
  try {
    const [opensRaw, askedRaw, available] = await Promise.all([
      AsyncStorage.getItem(OPENS_KEY),
      AsyncStorage.getItem(ASKED_KEY),
      StoreReview.isAvailableAsync(),
    ]);
    if (!available) return;

    const opens = opensRaw ? parseInt(opensRaw, 10) : 0;
    if (opens < MIN_OPENS_BEFORE_PROMPT) return;

    if (askedRaw) {
      const askedAt = parseInt(askedRaw, 10);
      if (Number.isFinite(askedAt) && Date.now() - askedAt < COOLDOWN_MS) return;
    }

    const hasAction = await StoreReview.hasAction();
    if (!hasAction) return;

    await StoreReview.requestReview();
    await AsyncStorage.setItem(ASKED_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}
