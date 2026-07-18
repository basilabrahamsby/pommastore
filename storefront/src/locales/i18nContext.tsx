'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { en } from './en';
import { ar } from './ar';
import api from '@/services/api';

type LocaleType = 'en' | 'ar';

interface I18nContextType {
  locale: LocaleType;
  t: (key: keyof typeof en) => string;
  changeLanguage: (lang: LocaleType) => void;
  isRtl: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocale] = useState<LocaleType>('en');

  // Detect language on mount
  useEffect(() => {
    const savedLocale = localStorage.getItem('pomma_locale') as LocaleType;
    if (savedLocale === 'ar' || savedLocale === 'en') {
      setLocale(savedLocale);
    } else {
      // Check browser language
      const browserLang = navigator.language.split('-')[0];
      if (browserLang === 'ar') {
        setLocale('ar');
      }
    }
  }, []);

  // Update layout direction, styles, and axios headers on change
  useEffect(() => {
    localStorage.setItem('pomma_locale', locale);
    
    // Toggle dir attribute on HTML root
    const root = document.documentElement;
    root.setAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
    root.setAttribute('lang', locale);
    
    // Inject API common headers for all backend requests
    api.defaults.headers.common['Accept-Language'] = locale;
  }, [locale]);

  const t = (key: keyof typeof en): string => {
    const dict = locale === 'ar' ? ar : en;
    return dict[key] || en[key] || String(key);
  };

  const changeLanguage = (lang: LocaleType) => {
    setLocale(lang);
  };

  const isRtl = locale === 'ar';

  return (
    <I18nContext.Provider value={{ locale, t, changeLanguage, isRtl }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
