import { NativeModules } from 'react-native';
import { canRequestAds } from './consent';
import { AD_UNITS } from './ads';
import { captureError } from './sentry';

// Same TurboModule guard as ads.ts / AdBanner: the require() succeeds with
// stubs in Expo Go but the first real call throws past JS try/catch, so gate
// on the native module's presence first.
const ADS_NATIVE_AVAILABLE = !!NativeModules.RNGoogleMobileAdsModule;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _InterstitialAd: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _AdEventType: any = null;

function loadModule(): boolean {
  if (_InterstitialAd) return true;
  if (!ADS_NATIVE_AVAILABLE) return false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const m = require('react-native-google-mobile-ads');
    _InterstitialAd = m.InterstitialAd;
    _AdEventType = m.AdEventType;
    return true;
  } catch {
    return false;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let interstitial: any = null;
let loaded = false;
let loading = false;
let lastShownAt = 0;
let launchedAt = 0;
let transitionsSinceShow = 0;

// Conservative, policy-safe pacing for a religious app — full-screen ads must
// never feel like a blocker:
//   • never in the first 45s after launch (no launch interstitial — AdMob bans it)
//   • at least 2.5 min between two interstitials
//   • at most one per 3 eligible screen transitions
const MIN_AFTER_LAUNCH_MS = 45_000;
const MIN_INTERVAL_MS = 150_000;
const SHOW_EVERY_N_TRANSITIONS = 3;

function preload(): void {
  if (!loadModule() || loading || loaded) return;
  const unitId = AD_UNITS.interstitial;
  if (!unitId) return; // no real unit in production → never load (see resolveInterstitial)
  loading = true;
  try {
    interstitial = _InterstitialAd.createForAdRequest(unitId, {
      keywords: ['islamic', 'muslim', 'prayer', 'education', 'family'],
    });
    interstitial.addAdEventListener(_AdEventType.LOADED, () => {
      loaded = true;
      loading = false;
    });
    interstitial.addAdEventListener(_AdEventType.ERROR, () => {
      loaded = false;
      loading = false;
    });
    interstitial.addAdEventListener(_AdEventType.CLOSED, () => {
      // One ad instance is single-use; warm the next one for later.
      loaded = false;
      interstitial = null;
      preload();
    });
    interstitial.load();
  } catch (e) {
    loading = false;
    interstitial = null;
    captureError(e, { scope: 'interstitial-preload' });
  }
}

// Warm the first interstitial. Stamps the launch baseline so the "no ad in the
// first 45s" rule has a reference even before consent resolves. Gated on the
// UMP consent check, same as banner/SDK init.
export async function initInterstitial(): Promise<void> {
  if (launchedAt === 0) launchedAt = Date.now();
  try {
    if (!(await canRequestAds())) return;
    preload();
  } catch {
    // Best-effort warm-up; maybeShowInterstitial() will retry preload().
  }
}

// Call on an eligible navigation transition (caller must already have checked
// the ads toggle and excluded sacred routes). Returns true iff an ad was shown.
export function maybeShowInterstitial(): boolean {
  transitionsSinceShow += 1;
  if (!loaded || !interstitial) {
    preload();
    return false;
  }
  const now = Date.now();
  if (launchedAt && now - launchedAt < MIN_AFTER_LAUNCH_MS) return false;
  if (now - lastShownAt < MIN_INTERVAL_MS) return false;
  if (transitionsSinceShow < SHOW_EVERY_N_TRANSITIONS) return false;
  try {
    interstitial.show();
    lastShownAt = now;
    transitionsSinceShow = 0;
    return true;
  } catch (e) {
    captureError(e, { scope: 'interstitial-show' });
    return false;
  }
}
