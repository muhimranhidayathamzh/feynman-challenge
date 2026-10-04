import Link from "next/link";

interface Props {
  pointCount: number;
  durationSec: number;
}

/**
 * Before the first take (audit #5): what will be judged and how to go about
 * it, in the tone of a friend (DESIGN.md §9). The point titles stay hidden:
 * showing them here would be the "outline" hint for free.
 */
export function StagePrep({ pointCount, durationSec }: Props) {
  const minutes = Math.max(1, Math.round(durationSec / 60));
  return (
    <div className="stage-prep">
      <p className="stage-prep-lead">
        Siap? Jelaskan seperti ke teman yang belum pernah dengar topik ini.
      </p>
      <ul className="stage-prep-list">
        <li>
          Ada <strong>{pointCount} poin</strong> yang dinilai. Urutannya bebas.
        </li>
        <li>Mulai dari gambaran besar, lalu pakai contoh atau analogimu sendiri.</li>
        <li>Lupa istilahnya? Jelaskan maknanya dengan kata sederhana.</li>
        <li>
          Kamu punya sekitar {minutes} menit, bisa dijeda, dan bisa didengarkan dulu
          sebelum dikirim.
        </li>
      </ul>
      {/* Prompt 5.2: an honest line before every take, the first included. */}
      <p className="stage-prep-note">
        Browser akan meminta izin mikrofon. Rekamanmu dikirim ke Google Gemini untuk
        dinilai, dan bisa kamu hapus kapan saja.{" "}
        <Link
          href="/privasi"
          target="_blank"
          rel="noopener noreferrer"
          className="text-link"
        >
          Privasi
          <span className="visually-hidden"> (membuka tab baru)</span>
        </Link>
      </p>
    </div>
  );
}
