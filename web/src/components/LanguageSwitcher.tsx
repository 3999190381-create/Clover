// web/src/components/LanguageSwitcher.tsx
"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();

  const switchLang = (lang: string) => {
    // Do NOT use next-intl router.replace({ locale }) — it can push /zh/... URLs
    // while this app has no [locale] segment → 404. Locale lives in cookie only.
    document.cookie = `NEXT_LOCALE=${lang};path=/;max-age=31536000;SameSite=Lax`;
    router.refresh();
  };

  return (
    <select
      value={locale}
      onChange={(e) => switchLang(e.target.value)}
      className="shrink-0 rounded-md border border-border px-2 py-1 text-sm bg-background text-text shadow-sm"
      aria-label="Language"
    >
      <option value="en">English</option>
      <option value="zh">中文</option>
    </select>
  );
}