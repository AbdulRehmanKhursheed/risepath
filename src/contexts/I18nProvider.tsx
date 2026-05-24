import React, { createContext, useContext, useMemo } from 'react';
import { I18nManager } from 'react-native';
import { useLanguage } from './LanguageContext';

type I18nValue = {
  /** Current language code: 'en' | 'ur' | 'ar'. */
  language: 'en' | 'ur' | 'ar';
  /** True if the current language is right-to-left. */
  isRTL: boolean;
  /** 'rtl' or 'ltr' — pass to Text style.writingDirection where needed. */
  writingDirection: 'rtl' | 'ltr';
  /** 'row-reverse' or 'row' — for flex containers that should flip in RTL. */
  flexDirection: 'row' | 'row-reverse';
  /** 'right' or 'left' — for text alignment in RTL. */
  textAlign: 'left' | 'right';
};

const I18nContext = createContext<I18nValue | null>(null);

const RTL_LANGUAGES: ReadonlyArray<'ur' | 'ar'> = ['ur', 'ar'];

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { language } = useLanguage();

  const value = useMemo<I18nValue>(() => {
    const isRTL = (RTL_LANGUAGES as ReadonlyArray<string>).includes(language);
    return {
      language: language as I18nValue['language'],
      isRTL,
      writingDirection: isRTL ? 'rtl' : 'ltr',
      flexDirection:    isRTL ? 'row-reverse' : 'row',
      textAlign:        isRTL ? 'right' : 'left',
    };
  }, [language]);

  // Keep I18nManager in sync (no-op forceRTL — we render bidirectionally
  // instead of restarting the bundle, which is what I18nManager.forceRTL
  // would require). This is intentional: we don't want a relaunch loop.
  void I18nManager;

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Read RTL/language info. Throws if used outside <I18nProvider>. */
export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}
