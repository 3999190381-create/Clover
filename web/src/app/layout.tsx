import "./globals.css";

import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';

import {
  fetchEnterpriseSettingsSS,
  fetchSettingsSS,
} from "@/components/settings/lib";
import {
  CUSTOM_ANALYTICS_ENABLED,
  GTM_ENABLED,
  SERVER_SIDE_ONLY__PAID_ENTERPRISE_FEATURES_ENABLED,
  NEXT_PUBLIC_CLOUD_ENABLED,
  MODAL_ROOT_ID,
} from "@/lib/constants";
import { Metadata } from "next";
import {
  EnterpriseSettings,
  ApplicationStatus,
} from "./admin/settings/interfaces";
import AppProvider from "@/components/context/AppProvider";
import { PHProvider } from "./providers";
import { getAuthTypeMetadataSS, getCurrentUserSS } from "@/lib/userSS";
import { Suspense } from "react";
import PostHogPageView from "./PostHogPageView";
import Script from "next/script";
import { WebVitals } from "./web-vitals";
import { ThemeProvider } from "next-themes";
import CloudError from "@/components/errorPages/CloudErrorPage";
import Error from "@/components/errorPages/ErrorPage";
import GatedContentWrapper from "@/components/GatedContentWrapper";
import { TooltipProvider } from "@/components/ui/tooltip";
import { fetchAppSidebarMetadata } from "@/lib/appSidebarSS";
import StatsOverlayLoader from "@/components/dev/StatsOverlayLoader";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LanguageProvider } from "@/hooks/useLanguage";

// `next/font/google` triggers build-time fetching of Google Fonts assets.
// For Docker builds in restricted/offline environments, we avoid it entirely.
// The actual typography falls back to `globals.css` (which already includes
// Google Font imports and local font-face definitions).
const inter = { variable: "" };
const hankenGrotesk = { variable: "" };

export async function generateMetadata(): Promise<Metadata> {
  let logoLocation = "/clover-logo.png";
  let enterpriseSettings: EnterpriseSettings | null = null;
  if (SERVER_SIDE_ONLY__PAID_ENTERPRISE_FEATURES_ENABLED) {
    enterpriseSettings = await (await fetchEnterpriseSettingsSS()).json();
    logoLocation =
      enterpriseSettings && enterpriseSettings.use_custom_logo
        ? "/api/enterprise-settings/logo"
        : "/clover-logo.png";
  }

  return {
    title: "Clover",
    description: "Question answering for your documents",
    icons: {
      icon: logoLocation,
    },
  };
}

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Next statically renders the framework /404 page during `next build`.
  // That render has no backend session and should not execute the full app
  // provider tree. Keep it deterministic; the normal branch is used by the
  // standalone server at runtime.
  if (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.NEXT_PRIVATE_STANDALONE === "true"
  ) {
    return (
      <html lang="en">
        <body>
          <main className="flex min-h-screen items-center justify-center bg-background px-6 text-text">
            <h1 className="text-2xl font-semibold">Clover</h1>
          </main>
        </body>
      </html>
    );
  }

  // Root layout doesn't have locale in params - locale is handled by next-intl middleware
  const locale = (await getLocale()) || 'en';
  const messages = (await getMessages({ locale })) || {};

  const [combinedSettings, user, authTypeMetadata] = await Promise.all([
    fetchSettingsSS(),
    getCurrentUserSS(),
    getAuthTypeMetadataSS(),
  ]);

  const { folded } = await fetchAppSidebarMetadata(user);

  const productGating =
    combinedSettings?.settings.application_status ?? ApplicationStatus.ACTIVE;

  const getPageContent = (content: React.ReactNode) => (
    <html
      lang={locale}
      className={`${inter.variable} ${hankenGrotesk.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, interactive-widget=resizes-content"
        />
        {CUSTOM_ANALYTICS_ENABLED &&
          combinedSettings?.customAnalyticsScript && (
            <script
              type="text/javascript"
              dangerouslySetInnerHTML={{
                __html: combinedSettings.customAnalyticsScript,
              }}
            />
          )}

        {GTM_ENABLED && (
          <Script
            id="google-tag-manager"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
               (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
               new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
               j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
               'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
               })(window,document,'script','dataLayer','GTM-PZXS36NG');
             `,
            }}
          />
        )}
      </head>

      <body className={`relative ${inter.variable} font-hanken`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="text-text min-h-screen bg-background">
            <TooltipProvider>
              <NextIntlClientProvider messages={messages} locale={locale}>
                <LanguageProvider>
                  <PHProvider>{content}</PHProvider>
                </LanguageProvider>
              </NextIntlClientProvider>
            </TooltipProvider>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );

  if (!combinedSettings) {
    // Keep the settings-unavailable fallback completely self-contained. During
    // a standalone Next.js build the backend is not available, so rendering
    // the full provider/error-page tree can pull in client-only components and
    // make the generated /404 page fail. The runtime error message remains
    // useful while avoiding those build-time dependencies.
    return (
      <html lang={locale}>
        <body>
          <main className="flex min-h-screen items-center justify-center bg-background px-6 text-text">
            <div className="max-w-md text-center">
              <h1 className="text-2xl font-semibold">
                {NEXT_PUBLIC_CLOUD_ENABLED
                  ? "Maintenance in Progress"
                  : "Unable to load Clover settings"}
              </h1>
              <p className="mt-2 text-sm text-text-secondary">
                Please check the backend service configuration and try again.
              </p>
            </div>
          </main>
        </body>
      </html>
    );
  }

  // When gated, wrap children in GatedContentWrapper which checks the path
  // client-side and shows AccessRestrictedPage for non-billing paths.
  //
  // Trade-off: Server components still render and attempt API calls before the
  // client-side check runs. This is safe because the backend license enforcement
  // middleware returns 402 for all non-allowlisted API calls, preventing data
  // leakage. The user sees a brief loading state before being redirected.
  const content =
    productGating === ApplicationStatus.GATED_ACCESS ? (
      <GatedContentWrapper>{children}</GatedContentWrapper>
    ) : (
      children
    );

  return getPageContent(
    <AppProvider
      authTypeMetadata={authTypeMetadata}
      user={user}
      settings={combinedSettings}
      folded={folded}
    >
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      <div id={MODAL_ROOT_ID} className="h-screen w-screen">
        {content}
      </div>
      <LanguageSwitcher />
      {process.env.NEXT_PUBLIC_POSTHOG_KEY && <WebVitals />}
      {process.env.NEXT_PUBLIC_ENABLE_STATS === "true" && (
        <StatsOverlayLoader />
      )}
    </AppProvider>
  );
}
