import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, NativeModules } from 'react-native';
import { theme } from '../constants/theme';
import { whenAdsInitialized } from '../services/ads';

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
  const [attempt, setAttempt] = useState(0);
  // Gate on Mobile Ads SDK init, which is itself gated on UMP consent
  // (canRequestAds). Ensures no ad request fires before/without consent.
  const [adsReady, setAdsReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    whenAdsInitialized().then(() => {
      if (mounted) setAdsReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // On failure, schedule a re-attempt with backoff; bumping `attempt` remounts
  // BannerAd (via key) which issues a fresh request.
  useEffect(() => {
    if (!failed || attempt >= RETRY_DELAYS_MS.length) return;
    const t = setTimeout(() => {
      setFailed(false);
      setLoaded(false);
      setAttempt((a) => a + 1);
    }, RETRY_DELAYS_MS[attempt]);
    return () => clearTimeout(t);
  }, [failed, attempt]);

  if (!adsAvailable || !adsReady || failed) return null;

  return (
    <View style={[styles.wrapper, !loaded && styles.hidden]}>
      <Text style={styles.label}>Sponsored</Text>
      <BannerAd
        key={attempt}
        unitId={unitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          keywords: ['islamic', 'muslim', 'prayer', 'quran', 'education', 'family'],
        }}
        onAdLoaded={() => setLoaded(true)}
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
