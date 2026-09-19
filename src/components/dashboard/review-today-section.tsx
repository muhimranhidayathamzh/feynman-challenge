import Link from "next/link";

import type { ReviewItem } from "@/lib/utils/dashboard";

export type { ReviewItem };

function describe(item: ReviewItem): string {
  if (item.daysOverdue <= 0) return "Jadwal hari ini";
  if (item.lapsed) return `Terlambat ${item.daysOverdue} hari · penguasaan menurun`;
  return `Terlambat ${item.daysOverdue} hari`;
}

/** Spaced-repetition reviews that are due (replaces the old 30-day decay alert). */
export function ReviewTodaySection({ items }: { items: ReviewItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="stack gap-3" aria-labelledby="review-today-title">
      <h2 id="review-today-title" className="section-title">
        Review Hari Ini
      </h2>
      <p className="text-secondary text-sm">
        Jelaskan ulang sekarang supaya tetap ingat. Makin konsisten, makin jarang
        jadwalnya.
      </p>
      <ul className="stack gap-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link href={`/challenge/${item.id}/record`} className="alert-row">
              <span className="font-medium">{item.title}</span>
              <span className="text-sm text-warning">{describe(item)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
