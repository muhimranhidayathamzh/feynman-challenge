import Link from "next/link";

import type { DeadlineStatus } from "@/lib/utils/deadline";

export interface DueSoonItem {
  id: string;
  title: string;
  status: DeadlineStatus;
  nudge: string | null;
}

const STATUS_COLOR: Record<DeadlineStatus, string> = {
  none: "var(--text-secondary)",
  upcoming: "var(--text-secondary)",
  due_soon: "var(--warning)",
  due_today: "var(--warning)",
  overdue: "var(--error)",
  extended_overdue: "var(--error)",
};

export function DueSoonSection({ items }: { items: DueSoonItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="stack" style={{ gap: "var(--space-3)" }}>
      <h2 style={{ fontSize: "var(--text-xl)" }}>⚡ Due Soon</h2>
      <div className="stack" style={{ gap: "var(--space-2)" }}>
        {items.map((item) => (
          <Link key={item.id} href={`/challenge/${item.id}`} className="alert-row">
            <span className="font-medium">{item.title}</span>
            {item.nudge && (
              <span
                className="text-sm"
                style={{ color: STATUS_COLOR[item.status], whiteSpace: "nowrap" }}
              >
                {item.nudge}
              </span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
