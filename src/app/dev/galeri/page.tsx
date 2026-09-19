import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FRAMES } from "./frame-list";

export const metadata: Metadata = {
  title: "Galeri layar",
  robots: { index: false, follow: false },
};

/**
 * Development-only index of every screen state (Fase V). Each link opens one
 * screen with fixed data; scripts/shots.mjs photographs them from here.
 */
export default function GalleryIndexPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const groups = [...new Set(FRAMES.map((frame) => frame.group))];
  return (
    <main className="page page-narrow">
      <h1>Galeri layar</h1>
      <p className="text-secondary">
        Semua layar dengan data contoh. Hanya ada di mode development.
      </p>
      {groups.map((group) => (
        <section key={group} className="stack gap-2">
          <h2 className="text-xl">{group}</h2>
          <ul className="stack gap-1">
            {FRAMES.filter((frame) => frame.group === group).map((frame) => (
              <li key={frame.id}>
                <Link
                  href={`/dev/galeri/${frame.id}`}
                  data-frame={frame.id}
                  data-capture={frame.capture ?? "page"}
                >
                  {frame.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
