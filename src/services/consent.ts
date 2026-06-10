import { NativeModules } from 'react-native';
import { captureError } from './sentry';

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

// Cap only the network step (requestInfoUpdate) — never the consent form
// itself. An EEA user reading the form can legitimately take minutes; cutting
// the form off early would record no choice and leave canRequestAds false.
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    p,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

let gatherPromise: Promise<void> | null = null;

/**
 * Gather UMP consent: refresh consent info (4s-capped network call), then
 * load + show the consent form if required (uncapped — user-paced).
 *
 * Re-callable: a failed attempt clears the in-flight promise so the next
 * call retries within the same session (previously a failed first attempt
 * was latched forever by a `requested` flag).
 */
export async function requestAdsConsent(): Promise<void> {
  if (gatherPromise) return gatherPromise;
  if (!loadModule()) return;

  gatherPromise = (async () => {
    // requestInfoUpdate hits Google's servers; capped so a dead network
    // can't stall the startup chain. UMP persists the previous session's
    // consent state natively, so on timeout canRequestAds() below still
    // reflects the last known answer.
    const info = await withTimeout(
      _AdsConsent.requestInfoUpdate({
        debugGeography: __DEV__ ? _AdsConsentDebugGeography?.EEA : undefined,
      }),
      4000
    );
    if (info && (info as { isConsentFormAvailable?: boolean }).isConsentFormAvailable) {
      // User-paced; intentionally not wrapped in a timeout.
      await _AdsConsent.loadAndShowConsentFormIfRequired();
    }
  })();

  try {
    await gatherPromise;
  } catch (e) {
    gatherPromise = null; // allow a retry later in the session
    captureError(e, { scope: 'ads-consent' });
  }
}

/**
 * Google UMP gate for ad requests: true only when consent gathering is
 * complete enough that the SDK may be initialized and ads requested.
 * The value persists across sessions inside the UMP SDK, so this is
 * meaningful even before requestAdsConsent() finishes (or if it failed).
 */
export async function canRequestAds(): Promise<boolean> {
  if (!loadModule()) return false;
  try {
    const info = await _AdsConsent.getConsentInfo();
    return !!info?.canRequestAds;
  } catch {
    return false;
  }
}

/** Whether Google requires a privacy-options entry point for this user (EEA). */
export async function isPrivacyOptionsRequired(): Promise<boolean> {
  if (!loadModule()) return false;
  try {
    const info = await _AdsConsent.getConsentInfo();
    return info?.privacyOptionsRequirementStatus === 'REQUIRED';
  } catch {
    return false;
  }
}

/** Re-entry point so EEA users can change/withdraw consent after first launch. */
export async function showPrivacyOptions(): Promise<void> {
  if (!loadModule()) return;
  try {
    await _AdsConsent.showPrivacyOptionsForm();
  } catch (e) {
    captureError(e, { scope: 'ads-privacy-options' });
  }
}
