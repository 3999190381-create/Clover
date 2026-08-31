import { defineRouting } from "next-intl/routing";

const supportedLocales = ["en", "zh"] as const;

/** Chinese is the default for Clover; set NEXT_PUBLIC_DEFAULT_LOCALE=en to opt into English. */
function resolveDefaultLocale(): (typeof supportedLocales)[number] {
  const v = process.env.NEXT_PUBLIC_DEFAULT_LOCALE?.toLowerCase().trim();
  return v === "en" ? "en" : "zh";
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
