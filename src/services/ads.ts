import { Platform, NativeModules } from 'react-native';
import { canRequestAds } from './consent';
import { captureError } from './sentry';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _MobileAds: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _MaxAdContentRating: any = null;

// Hard-gate the ads module behind a TurboModule check. Without this, Expo Go
// (which has no AdMob native binary) crashes with "Invariant Violation:
// TurboModuleRegistry.getEnforcing(...): 'RNGoogleMobileAdsModule' could not
// be found" — the require itself succeeds with stubs, but the first call
// throws past JS try/catch.
const ADS_NATIVE_AVAILABLE = !!NativeModules.RNGoogleMobileAdsModule;

function loadAdsModule() {
  if (_MobileAds) return true;
  if (!ADS_NATIVE_AVAILABLE) return false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const m = require('react-native-google-mobile-ads');
    _MobileAds = m.default;
    _MaxAdContentRating = m.MaxAdContentRating;
    return true;
  } catch {
    return false;
  }
}

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const TEST_BANNER = Platform.select({
  android: 'ca-app-pub-3940256099942544/6300978111',
  ios: 'ca-app-pub-3940256099942544/2934735716',
  default: 'ca-app-pub-3940256099942544/6300978111',
}) as string;

function resolveBanner(envValue: string | undefined): string {
  if (!IS_PRODUCTION) return TEST_BANNER;
  if (!envValue) return TEST_BANNER;
  if (envValue.includes('XXXX')) return TEST_BANNER;
  return envValue;
}

export const AD_UNITS = {
  bannerHome: resolveBanner(process.env.EXPO_PUBLIC_ADMOB_BANNER_HOME),
  bannerStats: resolveBanner(process.env.EXPO_PUBLIC_ADMOB_BANNER_STATS),
  bannerMood: resolveBanner(process.env.EXPO_PUBLIC_ADMOB_BANNER_MOOD),
  bannerQibla: resolveBanner(process.env.EXPO_PUBLIC_ADMOB_BANNER_QIBLA),
  bannerPrayer: resolveBanner(process.env.EXPO_PUBLIC_ADMOB_BANNER_PRAYER),
  bannerTasbih: resolveBanner(process.env.EXPO_PUBLIC_ADMOB_BANNER_TASBIH),
  bannerLearn: resolveBanner(process.env.EXPO_PUBLIC_ADMOB_BANNER_LEARN),
  bannerGuides: resolveBanner(process.env.EXPO_PUBLIC_ADMOB_BANNER_GUIDES),
  bannerSacred: resolveBanner(process.env.EXPO_PUBLIC_ADMOB_BANNER_SACRED),
  bannerDua: resolveBanner(process.env.EXPO_PUBLIC_ADMOB_BANNER_DUA),
  bannerNames: resolveBanner(process.env.EXPO_PUBLIC_ADMOB_BANNER_NAMES),
  bannerHifz: resolveBanner(process.env.EXPO_PUBLIC_ADMOB_BANNER_HIFZ),
};

let initialized = false;

// Resolves once the Mobile Ads SDK has successfully initialized (which only
// happens after the UMP consent gate passes). AdBanner awaits this before
// rendering a BannerAd so no ad request is ever fired pre-consent.
let resolveAdsReady: (() => void) | null = null;
const adsReadyPromise = new Promise<void>((resolve) => {
  resolveAdsReady = resolve;
});

export function whenAdsInitialized(): Promise<void> {
  return adsReadyPromise;
}

// One-shot Sentry assert: a production build resolving Google's TEST banner
// for any placement means the EXPO_PUBLIC_ADMOB_BANNER_* env var is missing
// from the EAS production environment — silent zero-revenue placements.
let reportedTestUnits = false;
function reportTestUnitsInProduction(): void {
  if (!IS_PRODUCTION || reportedTestUnits) return;
  reportedTestUnits = true;
  const testPlacements = Object.entries(AD_UNITS)
    .filter(([, unit]) => unit === TEST_BANNER)
    .map(([name]) => name);
  if (testPlacements.length > 0) {
    captureError(new Error('Production build resolved Google TEST banner units'), {
      scope: 'ads-config',
      placements: testPlacements,
    });
  }
}

export async function initAds(): Promise<void> {
  if (initialized) return;
  if (!loadAdsModule()) return;
  try {
    // UMP gate (Google policy): do not initialize the SDK / request ads
    // until consent gathering is complete. requestAdsConsent() may retry
    // and call initAds() again later in the session.
    if (!(await canRequestAds())) return;
    await _MobileAds().initialize();
    await _MobileAds().setRequestConfiguration({
      maxAdContentRating: _MaxAdContentRating.G,
      tagForChildDirectedTreatment: false,
      tagForUnderAgeOfConsent: false,
    });
    initialized = true;
    reportTestUnitsInProduction();
    resolveAdsReady?.();
  } catch (e) {
    // non-fatal for the user, but worth seeing in Sentry — a failed init
    // means zero ads for the whole session.
    captureError(e, { scope: 'ads-init' });
  }
}
