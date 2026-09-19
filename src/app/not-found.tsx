import { House } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <main className="state-screen state-screen-tall">
      <EmptyState
        illustration="error"
        title="Halaman ini tidak ditemukan"
        headingLevel="h1"
        actions={
          <ButtonLink href="/" icon={House}>
            Ke beranda
          </ButtonLink>
        }
      >
        <p>Tautannya mungkin salah ketik, atau tantangannya sudah dihapus.</p>
      </EmptyState>
    </main>
  );
}
