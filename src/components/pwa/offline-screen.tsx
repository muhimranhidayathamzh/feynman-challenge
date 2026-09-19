import { RotateCw } from "lucide-react";

import { buttonClassName } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";

/** Friendly offline fallback. Static and script-free (see app/offline). */
export function OfflineScreen() {
  return (
    <main id="main" className="state-screen state-screen-tall">
      <EmptyState
        illustration="offline"
        title="Kamu sedang offline"
        headingLevel="h1"
        actions={
          // A plain link reloads the page the learner was trying to open.
          <a href="" className={buttonClassName({ variant: "primary" })}>
            <Icon icon={RotateCw} size={16} />
            Coba lagi
          </a>
        }
      >
        <p>
          Feynman Challenge butuh internet untuk memuat tantanganmu dan menilai
          penjelasanmu. Rekaman dan catatan yang sudah tersimpan tetap aman.
        </p>
        <p className="text-sm">Sambungkan lagi internetmu, lalu muat ulang.</p>
      </EmptyState>
    </main>
  );
}
