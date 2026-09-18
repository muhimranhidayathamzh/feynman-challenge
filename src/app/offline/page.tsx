import type { Metadata } from "next";
import { RotateCw, WifiOff } from "lucide-react";

import { buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = {
  title: "Offline",
  robots: { index: false },
};

// Static on purpose: the service worker precaches this page (fetched without
// cookies) and serves it for any navigation that fails offline. It must never
// contain user data, and it must work without JavaScript.
export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <main id="main" className="state-screen state-screen-tall">
      <Card className="state-card">
        <Icon icon={WifiOff} size={40} className="state-icon" />
        <h1 className="text-2xl">Kamu sedang offline</h1>
        <p className="text-secondary">
          Feynman Challenge butuh internet untuk memuat tantanganmu dan menilai
          penjelasanmu. Rekaman dan catatan yang sudah tersimpan tetap aman di server.
        </p>
        <p className="text-muted text-sm">
          Sambungkan lagi internetmu, lalu muat ulang halaman ini.
        </p>
        <div className="state-actions">
          {/* A plain link reloads the page the learner was trying to open. */}
          <a href="" className={buttonClassName({ variant: "primary" })}>
            <Icon icon={RotateCw} size={16} />
            Coba lagi
          </a>
        </div>
      </Card>
    </main>
  );
}
