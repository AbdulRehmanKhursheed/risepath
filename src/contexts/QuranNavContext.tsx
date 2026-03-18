import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type QuranNavContextType = {
  pendingSurah: number | null;
  openSurah: (surahNumber: number) => void;
  clearPending: () => void;
};

const QuranNavContext = createContext<QuranNavContextType>({
  pendingSurah: null,
  openSurah: () => {},
  clearPending: () => {},
});

export function QuranNavProvider({ children }: { children: ReactNode }) {
  const [pendingSurah, setPendingSurah] = useState<number | null>(null);
  const openSurah = useCallback((n: number) => setPendingSurah(n), []);
  const clearPending = useCallback(() => setPendingSurah(null), []);

  return (
    <QuranNavContext.Provider value={{ pendingSurah, openSurah, clearPending }}>
      {children}
    </QuranNavContext.Provider>
  );
}

export function useQuranNav() {
  return useContext(QuranNavContext);
}
