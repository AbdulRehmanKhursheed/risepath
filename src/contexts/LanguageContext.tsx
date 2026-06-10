import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, Language, Translations, LANGUAGES } from '../constants/translations';
import { scheduleStreakReminder, scheduleJumuahReminder } from '../services/notifications';
import { setAiLanguage } from '../services/ai';
import { captureError } from '../services/sentry';

const STORAGE_KEY = 'app_language';

type LanguageContextType = {
  language: Language;
  t: Translations;
  setLanguage: (lang: Language) => Promise<void>;
  languages: typeof LANGUAGES;
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  t: translations.en,
  setLanguage: async () => {},
  languages: LANGUAGES,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  // Set as soon as the user explicitly picks a language. The async hydration
  // below must never overwrite an explicit choice made before it resolves
  // (e.g. tapping a language card on the onboarding screen right away).
  const userSelectedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!mounted || userSelectedRef.current) return;
        if (stored === 'en' || stored === 'ur' || stored === 'ar') {
          setLanguageState(stored);
          setAiLanguage(stored);
        }
      })
      .catch(() => {
        // Failed read: stay on the 'en' default. Cosmetic fallback only —
        // don't crash and don't surface an unhandled rejection at app root.
      });
    return () => { mounted = false; };
  }, []);

  const setLanguage = async (lang: Language) => {
    userSelectedRef.current = true;
    setLanguageState(lang);
    setAiLanguage(lang);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      // The in-memory switch above already took effect for this session;
      // persistence failing means it won't survive a restart. Report it —
      // callers fire-and-forget this promise, so throwing would only
      // produce an unhandled rejection.
      captureError(e, { scope: 'language-persist' });
    }
    // Rebuild the repeating streak/Jumu'ah reminders in the new language —
    // they are idempotent reschedulers, and without this they keep firing in
    // the previous language until the next cold start.
    scheduleStreakReminder(lang).catch(() => {});
    scheduleJumuahReminder(lang).catch(() => {});
  };

  return (
    <LanguageContext.Provider
      value={{ language, t: translations[language], setLanguage, languages: LANGUAGES }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
