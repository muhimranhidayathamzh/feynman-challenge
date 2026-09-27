import { CreateForm } from "./create-form";

/** "Tantangan Baru" markup (page and dev gallery). */
export function NewChallengeView() {
  return (
    <section className="page page-narrow">
      <div className="stack gap-2">
        <h1>Tantangan baru</h1>
        <p className="text-secondary">
          Tulis apa saja yang ingin kamu pahami. AI menyusun poin yang perlu kamu
          jelaskan, sumber belajarnya, dan berapa lama kamu perlu merekam.
        </p>
      </div>

      <CreateForm />
    </section>
  );
}
