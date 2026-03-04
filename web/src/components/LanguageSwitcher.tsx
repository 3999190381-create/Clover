// web/src/components/LanguageSwitcher.tsx
'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next-intl/client'; // ✅ 合并导入

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLang = (lang: string) => {
    router.push(pathname, { locale: lang });
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