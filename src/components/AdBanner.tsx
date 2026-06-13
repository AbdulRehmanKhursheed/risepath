import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform, NativeModules } from 'react-native';
import { theme } from '../constants/theme';
import { whenAdsInitialized, isAdsInitialized, retryAdsInit } from '../services/ads';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let BannerAd: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let BannerAdSize: any = null;

// TurboModules (RN 0.71+) throw before JS try/catch can intercept if the native
// module isn't registered. Guard with NativeModules presence check first.
const adsAvailable = !!NativeModules.RNGoogleMobileAdsModule;

if (adsAvailable) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const m = require('react-native-google-mobile-ads');
    BannerAd = m.BannerAd;
    BannerAdSize = m.BannerAdSize;
  } catch {
    // no-op
  }
}

type Props = {
  unitId: string;
};

// Retry ladder for failed ad loads. Tab screens are keep-alive (mounted for
// the whole session), so without retries a single no-fill / network blip at
// cold start would remove the banner from that screen permanently.
const RETRY_DELAYS_MS = [30_000, 60_000, 120_000, 300_000];

export function AdBanner({ unitId }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  // Remount key for BannerAd — monotonic, bumped on every retry.
  const [retryNonce, setRetryNonce] = useState(0);
  // Backoff budget for the CURRENT failure streak. Kept separate from the
  // remount key so a successful load can reset it to 0 (restarting the
  // ladder for later auto-refresh failures on keep-alive tabs) without
  // remounting — and thus re-requesting — a banner that just loaded.
  const attemptRef = useRef(0);
  // Gate on Mobile Ads SDK init, which is itself gated on UMP consent
  // (canRequestAds). Ensures no ad request fires before/without consent.
  const [adsReady, setAdsReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    // If the one-shot startup chain failed (e.g. UMP info update timed out
    // on first launch), a banner mounting is a natural moment to re-attempt
    // consent + SDK init. Throttled + idempotent inside the service.
    if (!isAdsInitialized()) retryAdsInit().catch(() => {});
    whenAdsInitialized().then(() => {
      if (mounted) setAdsReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // On failure, schedule a re-attempt with backoff; bumping `retryNonce`
  // remounts BannerAd (via key) which issues a fresh request.
  useEffect(() => {
    if (!failed || attemptRef.current >= RETRY_DELAYS_MS.length) return;
    const t = setTimeout(() => {
      attemptRef.current += 1;
      setFailed(false);
      setLoaded(false);
      setRetryNonce((n) => n + 1);
    }, RETRY_DELAYS_MS[attemptRef.current]);
    return () => clearTimeout(t);
  }, [failed]);

  if (!adsAvailable || !adsReady || failed) return null;

  return (
    <View style={[styles.wrapper, !loaded && styles.hidden]}>
      <Text style={styles.label}>Sponsored</Text>
      <BannerAd
        key={retryNonce}
        unitId={unitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          keywords: ['islamic', 'muslim', 'prayer', 'quran', 'education', 'family'],
        }}
        onAdLoaded={() => {
          // Reset the backoff budget: a banner that served successfully for
          // hours must not vanish for the rest of the session just because
          // auto-refresh failures eventually exhausted a lifetime cap.
          attemptRef.current = 0;
          setLoaded(true);
        }}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 4 : 0,
    ...Platform.select({
      ios: {
        shadowColor: '#7A5A40',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: { elevation: 3 },
    }),
  },
  hidden: {
    height: 0,
    overflow: 'hidden',
  },
  label: {
    fontSize: 10,
    color: theme.colors.textMuted,
    fontFamily: 'PlusJakartaSans_400Regular',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
  },
});
