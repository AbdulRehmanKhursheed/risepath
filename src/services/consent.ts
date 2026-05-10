import { NativeModules } from 'react-native';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _AdsConsent: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _AdsConsentDebugGeography: any = null;

const ADS_NATIVE_AVAILABLE = !!NativeModules.RNGoogleMobileAdsModule;

function loadModule(): boolean {
  if (_AdsConsent) return true;
  if (!ADS_NATIVE_AVAILABLE) return false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const m = require('react-native-google-mobile-ads');
    _AdsConsent = m.AdsConsent;
    _AdsConsentDebugGeography = m.AdsConsentDebugGeography;
    return !!_AdsConsent;
  } catch {
    return false;
  }
}

let requested = false;

export async function requestAdsConsent(): Promise<void> {
  if (requested) return;
  requested = true;
  if (!loadModule()) return;

  try {
    const info = await _AdsConsent.requestInfoUpdate({
      debugGeography: __DEV__ ? _AdsConsentDebugGeography?.EEA : undefined,
    });
    if (info.isConsentFormAvailable) {
      await _AdsConsent.showFormIfRequired();
    }
  } catch {
    // If the consent flow fails, ads fall back to non-personalised — that is
    // the safe default and complies with GDPR without blocking the app.
  }
}
