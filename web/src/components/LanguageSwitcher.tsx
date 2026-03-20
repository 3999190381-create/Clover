// web/src/components/LanguageSwitcher.tsx
'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLang = (lang: string) => {
    document.cookie = `NEXT_LOCALE=${lang};path=/;max-age=31536000`;
    router.refresh();
  };

  return (
    <select 
      value={locale} 
      onChange={(e) => switchLang(e.target.value)}
      className="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-800"
    >
      <option value="en">🇺 English</option>
      <option value="zh">🇨 中文</option>
    </select>
  );
}