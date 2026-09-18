"use client";

import { useEffect } from "react";
import { House, RotateCcw, TriangleAlert } from "lucide-react";

import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="state-screen">
      <Card className="state-card">
        <Icon icon={TriangleAlert} size={40} className="state-icon" />
        <h2>Ada yang tidak beres</h2>
        <p className="text-secondary">
          Terjadi kesalahan tak terduga. Coba lagi atau kembali ke beranda.
        </p>
        <div className="state-actions">
          <Button icon={RotateCcw} onClick={reset}>
            Coba lagi
          </Button>
          <ButtonLink href="/" variant="ghost" icon={House}>
            Ke Beranda
          </ButtonLink>
        </div>
      </Card>
    </main>
  );
}
