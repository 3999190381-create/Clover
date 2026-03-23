import { defineRouting } from "next-intl/routing";

const supportedLocales = ["en", "zh"] as const;

/** Set `NEXT_PUBLIC_DEFAULT_LOCALE=zh` at build time (e.g. Docker ARG) for Chinese-first deployments. */
function resolveDefaultLocale(): (typeof supportedLocales)[number] {
  const v = process.env.NEXT_PUBLIC_DEFAULT_LOCALE?.toLowerCase().trim();
  return v === "zh" ? "zh" : "en";
}

export const routing = defineRouting({
  locales: supportedLocales,
  defaultLocale: resolveDefaultLocale(),
  // App routes live at /admin, /chat, … without a `[locale]` segment.
  // Keep URLs without /zh/ or /en/ prefix; locale comes from cookie (NEXT_LOCALE).
  localePrefix: "never",
});

export const locales = routing.locales;
export const defaultLocale = routing.defaultLocale;