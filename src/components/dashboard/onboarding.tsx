import { Plus } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { Illustration } from "@/components/ui/illustration";

const STEPS: { title: string; body: string }[] = [
  {
    title: "Pelajari",
    body: "Pilih topik. AI menyusun poin-poin yang perlu kamu kuasai, plus sumber belajarnya.",
  },
  {
    title: "Jelaskan",
    body: "Rekam penjelasanmu sendiri, seperti menerangkan ke teman. Tidak perlu sempurna.",
  },
  {
    title: "Lihat celahmu",
    body: "AI menandai poin yang sudah jelas dan yang belum, lengkap dengan kutipan ucapanmu.",
  },
];

/**
 * First run (DESIGN.md §11): the loop in three steps, then straight to work.
 * A numbered list, not three identical illustrated cards (§12 bans those,
 * reworked in V.7), so the first action stays within one screen.
 */
export function Onboarding({ displayName }: { displayName: string }) {
  return (
    <div className="stack gap-6">
      <div className="onboarding-intro">
        <Illustration name="catatan-kosong" />
        <div className="stack gap-2">
          <h1>Selamat datang, {displayName}</h1>
          <p className="reading text-secondary">
            Cara tercepat tahu kamu benar-benar paham adalah mencoba menjelaskannya. Tiga
            langkah ini yang akan kamu ulang terus.
          </p>
        </div>
      </div>

      <ol className="onboarding-list">
        {STEPS.map((step, index) => (
          <li key={step.title} className="onboarding-item">
            <span className="onboarding-step-number" aria-hidden="true">
              {index + 1}
            </span>
            <div className="stack gap-1">
              <h2 className="onboarding-item-title">{step.title}</h2>
              <p className="text-secondary">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="row flex-wrap gap-3">
        <ButtonLink href="/challenge/new" size="lg" icon={Plus}>
          Buat tantangan pertama
        </ButtonLink>
      </div>
    </div>
  );
}
