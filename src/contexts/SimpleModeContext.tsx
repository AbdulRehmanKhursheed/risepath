import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'simple_mode';

type SimpleModeContextType = {
  simpleMode: boolean;
  toggleSimpleMode: () => Promise<void>;
  fs: (base: number) => number;
};

const SimpleModeContext = createContext<SimpleModeContextType>({
  simpleMode: false,
  toggleSimpleMode: async () => {},
  fs: (n) => n,
});

export function SimpleModeProvider({ children }: { children: ReactNode }) {
  const [simpleMode, setSimpleMode] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((val) => {
        if (val === 'true') setSimpleMode(true);
      })
      .catch(() => {
        // Failed read: keep the default. Don't surface an unhandled
        // rejection at app root for a cosmetic preference.
      });
  }, []);

  const toggleSimpleMode = async () => {
    const next = !simpleMode;
    setSimpleMode(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // In-memory toggle already applied for this session; callers
      // fire-and-forget this promise, so swallow rather than reject.
    }
  };

  const fs = (base: number) => (simpleMode ? Math.round(base * 1.25) : base);

  return (
    <SimpleModeContext.Provider value={{ simpleMode, toggleSimpleMode, fs }}>
      {children}
    </SimpleModeContext.Provider>
  );
}

export function useSimpleMode() {
  return useContext(SimpleModeContext);
}
