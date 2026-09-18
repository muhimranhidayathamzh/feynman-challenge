import type { Metadata } from "next";

import { CreateForm } from "@/components/challenge/create-form";

export const metadata: Metadata = {
  title: "Tantangan Baru",
};

export default function NewChallengePage() {
  return (
    <section
      className="stack"
      style={{ gap: "var(--space-6)", maxWidth: "40rem", marginInline: "auto" }}
    >
      <div className="stack" style={{ gap: "var(--space-2)" }}>
        <h1>
          Tantangan <span className="gradient-text">Baru</span>
        </h1>
        <p className="text-secondary">
          Pilih topik apapun — AI akan menyusun learning outline, sumber belajar, dan
          estimasi durasi rekaman.
        </p>
      </div>

      <CreateForm />
    </section>
  );
}
