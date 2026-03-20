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
  const [translations, setTranslations] = useState<Record<string, any>>({});

  // ✅ 关键：从 localStorage 读取语言偏好
  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang && ['en', 'zh'].includes(savedLang)) {
      setLanguageState(savedLang);
    }
  }, []);

  // ✅ 关键：加载翻译文件
  useEffect(() => {
    console.log('Loading translations for:', language);  // ← 添加调试日志
    fetch(`/messages/${language}.json`)
      .then(res => {
        console.log('Response status:', res.status);  // ← 添加调试日志
        return res.json();
      })
      .then(data => {
        console.log('Translations loaded:', data);  // ← 添加调试日志
        setTranslations(data);
      })
      .catch(err => console.error('Failed to load translations:', err));
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
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