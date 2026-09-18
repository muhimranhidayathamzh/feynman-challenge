import { FlaskConical, Save } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

/** Shown on every app page while the learner uses an anonymous demo account. */
export function DemoBanner() {
  return (
    <aside className="demo-banner" aria-label="Mode demo">
      <Icon icon={FlaskConical} size={18} className="demo-banner-icon" />
      <p className="flex-1 text-sm">
        <strong>Mode demo.</strong> Tantangan Fotosintesis adalah contoh, dan kuota AI
        dibatasi. Simpan progresmu jadi akun agar datanya tidak hilang saat keluar.
      </p>
      <ButtonLink
        href="/pengaturan#simpan-akun"
        variant="secondary"
        size="sm"
        icon={Save}
      >
        Simpan progres
      </ButtonLink>
    </aside>
  );
}
