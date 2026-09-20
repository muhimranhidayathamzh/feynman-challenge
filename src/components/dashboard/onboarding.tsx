import { Plus } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Illustration, type IllustrationName } from "@/components/ui/illustration";

const STEPS: { illustration: IllustrationName; title: string; body: string }[] = [
  {
    illustration: "catatan-kosong",
    title: "Pelajari",
    body: "Pilih topik. AI menyusun poin-poin yang perlu kamu kuasai, plus sumber belajarnya.",
  },
  {
    illustration: "mendengarkan",
    title: "Jelaskan",
    body: "Rekam penjelasanmu sendiri, seperti menerangkan ke teman. Tidak perlu sempurna.",
  },
  {
    illustration: "hasil",
    title: "Lihat celahmu",
    body: "AI menandai poin yang sudah jelas dan yang belum, lengkap dengan kutipan ucapanmu.",
  },
];

/** First run (DESIGN.md §11): the loop in three steps, then straight to work. */
export function Onboarding({ displayName }: { displayName: string }) {
  return (
    <div className="stack gap-6">
      <div className="stack gap-2">
        <h1>Selamat datang, {displayName}</h1>
        <p className="reading text-secondary">
          Cara tercepat tahu kamu benar-benar paham adalah mencoba menjelaskannya. Tiga
          langkah ini yang akan kamu ulang terus.
        </p>
      </div>

      <ol className="onboarding-steps">
        {STEPS.map((step, index) => (
          <li key={step.title}>
            <Sheet className="onboarding-step">
              <Illustration name={step.illustration} />
              <h2 className="onboarding-step-title">
                <span className="onboarding-step-number">{index + 1}</span>
                {step.title}
              </h2>
              <p className="text-secondary text-sm">{step.body}</p>
            </Sheet>
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
