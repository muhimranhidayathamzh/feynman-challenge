import type { Metadata } from "next";

import { OfflineScreen } from "@/components/pwa/offline-screen";

export const metadata: Metadata = {
  title: "Offline",
  robots: { index: false },
};

// Static on purpose: the service worker precaches this page (fetched without
// cookies) and serves it for any navigation that fails offline. It must never
// contain user data, and it must work without JavaScript.
export const dynamic = "force-static";

export default function OfflinePage() {
  return <OfflineScreen />;
}
