import { unstable_noStore as noStore } from "next/cache";
import { InstantSSRAutoRefresh } from "@/components/SSRAutoRefresh";
import NRFPage from "@/app/chat/nrf/NRFPage";
import { NRFPreferencesProvider } from "@/components/context/NRFPreferencesContext";
import * as AppLayouts from "@/layouts/app-layouts";
import { Suspense } from "react";

export default async function Page() {
  noStore();

  return (
    <AppLayouts.Root>
      <InstantSSRAutoRefresh />
      <NRFPreferencesProvider>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
          <NRFPage isSidePanel />
        </Suspense>
      </NRFPreferencesProvider>
    </AppLayouts.Root>
  );
}
