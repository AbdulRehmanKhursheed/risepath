import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
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
  // Set as soon as the user explicitly toggles. The async hydration below
  // must never overwrite an explicit choice made before it resolves (same
  // guard as LanguageContext — late hydration used to silently re-enable
  // a mode the user had just turned off).
  const userSelectedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((val) => {
        if (!mounted || userSelectedRef.current) return;
        if (val === 'true') setSimpleMode(true);
      })
      .catch(() => {
        // Failed read: keep the default. Don't surface an unhandled
        // rejection at app root for a cosmetic preference.
      });
    return () => { mounted = false; };
  }, []);

  const toggleSimpleMode = async () => {
    userSelectedRef.current = true;
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
