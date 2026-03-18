import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'simple_mode';

type SimpleModeContextType = {
  simpleMode: boolean;
  toggleSimpleMode: () => Promise<void>;
  fs: (base: number) => number; // font scale helper
};

const SimpleModeContext = createContext<SimpleModeContextType>({
  simpleMode: false,
  toggleSimpleMode: async () => {},
  fs: (n) => n,
});

export function SimpleModeProvider({ children }: { children: ReactNode }) {
  const [simpleMode, setSimpleMode] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val === 'true') setSimpleMode(true);
    });
  }, []);

  const toggleSimpleMode = async () => {
    const next = !simpleMode;
    setSimpleMode(next);
    await AsyncStorage.setItem(STORAGE_KEY, String(next));
  };

  // In simple mode, scale up font sizes by 25%
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
