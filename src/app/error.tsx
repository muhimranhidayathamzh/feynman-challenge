"use client";

import { useEffect } from "react";
import { House, RotateCcw } from "lucide-react";

import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { logError } from "@/lib/monitoring/report";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logError("[client] render failed:", error);
  }, [error]);

  return (
    <main className="state-screen">
      <EmptyState
        illustration="error"
        title="Ada yang tidak beres"
        actions={
          <>
            <Button icon={RotateCcw} onClick={reset}>
              Coba lagi
            </Button>
            <ButtonLink href="/" variant="ghost" icon={House}>
              Ke beranda
            </ButtonLink>
          </>
        }
      >
        <p>Kesalahannya ada di pihak kami, bukan kamu. Coba lagi sebentar.</p>
      </EmptyState>
    </main>
  );
}
