// web/src/components/LanguageSwitcher.tsx
'use client';

import { useLanguage } from '@/hooks/useLanguage';

export function LanguageSwitcher() {
  const { language: currentLocale, setLanguage } = useLanguage();

  const switchLang = (lang: 'en' | 'zh') => {
    setLanguage(lang);
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex items-center gap-1 rounded-lg border border-border bg-background/95 p-1 text-sm shadow-lg backdrop-blur"
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => switchLang('zh')}
        aria-pressed={currentLocale === 'zh'}
        className={`rounded-md px-3 py-1.5 transition-colors ${
          currentLocale === 'zh'
            ? 'bg-primary text-primary-foreground'
            : 'text-text-secondary hover:bg-background-tint-01'
        }`}
      >
        中文
      </button>
      <button
        type="button"
        onClick={() => switchLang('en')}
        aria-pressed={currentLocale === 'en'}
        className={`rounded-md px-3 py-1.5 transition-colors ${
          currentLocale === 'en'
            ? 'bg-primary text-primary-foreground'
            : 'text-text-secondary hover:bg-background-tint-01'
        }`}
      >
        English
      </button>
    </div>
  );
}
