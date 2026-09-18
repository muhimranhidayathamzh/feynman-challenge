import type { Metadata } from "next";

import { CreateForm } from "@/components/challenge/create-form";

export const metadata: Metadata = {
  title: "Tantangan Baru",
};

export default function NewChallengePage() {
  return (
    <section className="page page-narrow">
      <div className="stack gap-2">
        <h1>
          Tantangan <span className="gradient-text">Baru</span>
        </h1>
        <p className="text-secondary">
          Pilih topik apapun — AI akan menyusun outline materi, sumber belajar, dan
          estimasi durasi rekaman.
        </p>
      </div>

      <CreateForm />
    </section>
  );
}
