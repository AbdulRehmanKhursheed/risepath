import { Platform } from 'react-native';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _MobileAds: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _MaxAdContentRating: any = null;

function loadAdsModule() {
  if (_MobileAds) return true;
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
};

let initialized = false;

export async function initAds(): Promise<void> {
  if (initialized) return;
  if (!loadAdsModule()) return;
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
