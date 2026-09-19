import { CreateForm } from "./create-form";

/** "Tantangan Baru" markup (page and dev gallery). */
export function NewChallengeView() {
  return (
    <section className="page page-narrow">
      <div className="stack gap-2">
        <h1>Tantangan baru</h1>
        <p className="text-secondary">
          Pilih topik apa pun. AI akan menyusun outline materi, sumber belajar, dan
          perkiraan durasi rekaman.
        </p>
      </div>

      <CreateForm />
    </section>
  );
}
