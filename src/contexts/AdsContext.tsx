import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'ads_enabled_v1';

type AdsContextType = {
  // Whether banner ads should render. Defaults to true (ads on) so the free
  // app stays funded; users can opt out from the sidebar. Persisted locally.
  adsEnabled: boolean;
  toggleAds: () => Promise<void>;
};

const AdsContext = createContext<AdsContextType>({
  adsEnabled: true,
  toggleAds: async () => {},
});

export function AdsProvider({ children }: { children: ReactNode }) {
  const [adsEnabled, setAdsEnabled] = useState(true);
  // Set as soon as the user explicitly toggles. The async hydration below must
  // never overwrite an explicit choice made before it resolves (same guard as
  // SimpleModeContext — late hydration would otherwise re-enable ads the user
  // had just turned off this session).
  const userSelectedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((val) => {
        if (!mounted || userSelectedRef.current) return;
        // Only 'false' disables — any other value (incl. null on first launch)
        // keeps the funded-by-default ads-on state.
        if (val === 'false') setAdsEnabled(false);
      })
      .catch(() => {
        // Failed read: keep ads on (the safe default for a free app).
      });
    return () => { mounted = false; };
  }, []);

  const toggleAds = async () => {
    userSelectedRef.current = true;
    const next = !adsEnabled;
    setAdsEnabled(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // In-memory toggle already applied for this session; callers
      // fire-and-forget this promise, so swallow rather than reject.
    }
  };

  return (
    <AdsContext.Provider value={{ adsEnabled, toggleAds }}>
      {children}
    </AdsContext.Provider>
  );
}

export function useAds() {
  return useContext(AdsContext);
}
