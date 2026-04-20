import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { theme } from '../constants/theme';

// Lazy-require keeps Expo Go builds from crashing when the native module is absent.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let BannerAd: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let BannerAdSize: any = null;
let adsAvailable = false;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const m = require('react-native-google-mobile-ads');
  BannerAd = m.BannerAd;
  BannerAdSize = m.BannerAdSize;
  adsAvailable = true;
} catch {
  adsAvailable = false;
}

type Props = {
  unitId: string;
};

export function AdBanner({ unitId }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!adsAvailable || failed) return null;

  return (
    <View style={[styles.wrapper, !loaded && styles.hidden]}>
      <Text style={styles.label}>Sponsored</Text>
      <BannerAd
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
