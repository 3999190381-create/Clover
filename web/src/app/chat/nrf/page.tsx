import { unstable_noStore as noStore } from "next/cache";
import { InstantSSRAutoRefresh } from "@/components/SSRAutoRefresh";
import { cookies } from "next/headers";
import NRFPage from "./NRFPage";
import { NRFPreferencesProvider } from "@/components/context/NRFPreferencesContext";
import * as AppLayouts from "@/layouts/app-layouts";
import { Suspense } from "react";

export default async function Page() {
  noStore();
  const requestCookies = await cookies();

  return (
    <AppLayouts.Root disableFooter>
      <InstantSSRAutoRefresh />
      <NRFPreferencesProvider>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
          <NRFPage />
        </Suspense>
      </NRFPreferencesProvider>
    </AppLayouts.Root>
  );
}
