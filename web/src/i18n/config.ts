// web/src/i18n/config.ts
export const locales = ["en", "zh"] as const;
export type Locale = (typeof locales)[number];

function resolveDefaultLocale(): Locale {
  const v = process.env.NEXT_PUBLIC_DEFAULT_LOCALE?.toLowerCase().trim();
  return v === "zh" ? "zh" : "en";
}

export const defaultLocale: Locale = resolveDefaultLocale();