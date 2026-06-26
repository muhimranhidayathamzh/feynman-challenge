import Link from "next/link";

export interface DecayItem {
  id: string;
  title: string;
  daysSinceReview: number;
}

export function DecayAlert({ items }: { items: DecayItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="stack" style={{ gap: "var(--space-3)" }}>
      <h2 style={{ fontSize: "var(--text-xl)" }}>🍂 Perlu Review</h2>
      <div className="stack" style={{ gap: "var(--space-2)" }}>
        {items.map((item) => (
          <Link key={item.id} href={`/challenge/${item.id}`} className="alert-row">
            <span className="font-medium">{item.title}</span>
            <span
              className="text-sm"
              style={{ color: "var(--mastery-developing)", whiteSpace: "nowrap" }}
            >
              {item.daysSinceReview} hari sejak review
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
