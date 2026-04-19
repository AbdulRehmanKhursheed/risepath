import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, Language, Translations, LANGUAGES } from '../constants/translations';

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

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'en' || stored === 'ur' || stored === 'ar') {
        setLanguageState(stored);
      }
    });
  }, []);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    await AsyncStorage.setItem(STORAGE_KEY, lang);
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
