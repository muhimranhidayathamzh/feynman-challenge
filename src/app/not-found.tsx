import { House } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NotFound() {
  return (
    <main className="state-screen state-screen-tall">
      <Card className="state-card">
        <span className="gradient-text not-found-code">404</span>
        <h2>Halaman tidak ditemukan</h2>
        <p className="text-secondary">
          Tautan mungkin salah, atau challenge-nya sudah dihapus.
        </p>
        <ButtonLink href="/" icon={House}>
          Ke Dashboard
        </ButtonLink>
      </Card>
    </main>
  );
}
