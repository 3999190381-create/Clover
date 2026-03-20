// web/src/components/GlobalLanguageSwitcher.tsx
'use client';

import { useLanguage } from '@/hooks/useLanguage';

export function GlobalLanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <select 
        value={language} 
        onChange={(e) => setLanguage(e.target.value as 'en' | 'zh')}
        className="border rounded px-3 py-2 text-sm bg-white dark:bg-gray-800 
                   shadow-lg hover:shadow-xl transition-shadow
                   border-gray-300 dark:border-gray-600"
      >
        <option value="en">🇺🇸 English</option>
        <option value="zh">🇨 中文</option>
      </select>
    </div>
  );
}