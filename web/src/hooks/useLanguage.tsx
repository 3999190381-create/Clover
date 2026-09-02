// web/src/hooks/useLanguage.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'zh';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [translations] = useState<Record<string, any>>({});

  // ✅ 关键：从 localStorage 读取语言偏好
  useEffect(() => {
    const savedLang =
      (localStorage.getItem('language') as Language) ||
      (document.cookie.match(/(?:^|; )NEXT_LOCALE=(en|zh)/)?.[1] as Language);
    if (savedLang && ['en', 'zh'].includes(savedLang)) {
      setLanguageState(savedLang);
    }
    document.documentElement.lang = savedLang || 'en';
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    document.cookie = `NEXT_LOCALE=${lang};path=/;max-age=31536000`;
  };

  // ✅ 关键：翻译函数
  const t = (key: string) => {
    const keys = key.split('.');
    let value: any = translations;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
