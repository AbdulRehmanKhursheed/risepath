// react-native-google-mobile-ads is a native module that doesn't exist in
// Expo Go; all imports are guarded with try/catch for graceful degradation.

import { Platform } from 'react-native';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _MobileAds: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _MaxAdContentRating: any = null;

function loadAdsModule() {
  if (_MobileAds) return true;
  try {
    // Dynamic require keeps the native TurboModule from being touched at bundle parse time.
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

const TEST_IDS = {
  banner: Platform.select({
    android: 'ca-app-pub-3940256099942544/6300978111',
    ios: 'ca-app-pub-3940256099942544/2934735716',
    default: 'ca-app-pub-3940256099942544/6300978111',
  }) as string,
};

const PROD_IDS = {
  bannerHome: Platform.select({
    android: 'ca-app-pub-6562347670701476/1464122496',
    ios: 'ca-app-pub-3940256099942544/2934735716', // TODO: real iOS unit ID
    default: 'ca-app-pub-6562347670701476/1464122496',
  }) as string,
  bannerStats: Platform.select({
    android: 'ca-app-pub-6562347670701476/5813577418',
    ios: 'ca-app-pub-3940256099942544/2934735716', // TODO: real iOS unit ID
    default: 'ca-app-pub-6562347670701476/5813577418',
  }) as string,
};

export const AD_UNITS = {
  bannerHome: IS_PRODUCTION ? PROD_IDS.bannerHome : TEST_IDS.banner,

  bannerStats: IS_PRODUCTION ? PROD_IDS.bannerStats : TEST_IDS.banner,
};

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
    // non-fatal
  }
}
