/**
 * AdMob service for RisePath.
 *
 * Content policy for an Islamic app:
 *  - MaxAdContentRating.G  → strictest family-friendly filter
 *  - tagForChildDirectedTreatment: false  → not a children's app, but G-rated
 *  - tagForUnderAgeOfConsent: false
 *
 * Placement rules (enforced by only exporting units for safe screens):
 *  ✅  Home screen bottom banner
 *  ✅  Stats screen bottom banner
 *  ❌  Quran reader  — sacred text, no distraction
 *  ❌  Prayer Tracker — during salah time, no distraction
 *  ❌  Learn (duas/kalimas) — learning sacred content
 *  ❌  Qibla screen  — in-prayer orientation aid
 *  ❌  Umrah / Janaza Guide — sacred ritual guides
 *
 * NOTE: react-native-google-mobile-ads requires a native build (EAS / bare
 * workflow). It will NOT load in Expo Go. All imports are guarded with
 * try/catch so the app degrades gracefully without ads in Expo Go.
 */

import { Platform } from 'react-native';

// ─── Lazy-load the native AdMob module — crashes Expo Go if imported directly ─
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _MobileAds: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _MaxAdContentRating: any = null;

function loadAdsModule() {
  if (_MobileAds) return true;
  try {
    // Dynamic require keeps the native TurboModule from being accessed at bundle parse time.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const m = require('react-native-google-mobile-ads');
    _MobileAds = m.default;
    _MaxAdContentRating = m.MaxAdContentRating;
    return true;
  } catch {
    return false;
  }
}

// ─── Ad Unit IDs ────────────────────────────────────────────────────────────
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const TEST_IDS = {
  banner: Platform.select({
    android: 'ca-app-pub-3940256099942544/6300978111',
    ios: 'ca-app-pub-3940256099942544/2934735716',
    default: 'ca-app-pub-3940256099942544/6300978111',
  }) as string,
};

const PROD_IDS = {
  banner: Platform.select({
    android: 'ca-app-pub-6562347670701476/1464122496',
    ios: 'ca-app-pub-3940256099942544/2934735716', // replace with real iOS unit ID when available
    default: 'ca-app-pub-6562347670701476/1464122496',
  }) as string,
};

export const AD_UNITS = {
  bannerHome: IS_PRODUCTION ? PROD_IDS.banner : TEST_IDS.banner,

  bannerStats: IS_PRODUCTION ? PROD_IDS.banner : TEST_IDS.banner,
};

// ─── Initialisation ─────────────────────────────────────────────────────────
let initialized = false;

export async function initAds(): Promise<void> {
  if (initialized) return;
  if (!loadAdsModule()) return; // silently skip in Expo Go / native module missing
  try {
    await _MobileAds().initialize();
    await _MobileAds().setRequestConfiguration({
      maxAdContentRating: _MaxAdContentRating.G,
      tagForChildDirectedTreatment: false,
      tagForUnderAgeOfConsent: false,
    });
    initialized = true;
  } catch {
    // Non-fatal — app works without ads
  }
}
