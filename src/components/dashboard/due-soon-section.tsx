import Link from "next/link";
import type { DueSoonItem } from "@/lib/utils/dashboard";
import type { DeadlineStatus } from "@/lib/utils/deadline";

import { OverdueActions } from "./overdue-actions";

export type { DueSoonItem };

const STATUS_CLASS: Record<DeadlineStatus, string> = {
  none: "text-secondary",
  upcoming: "text-secondary",
  due_soon: "text-warning",
  due_today: "text-warning",
  overdue: "text-warning",
  extended_overdue: "text-warning",
};

export function DueSoonSection({ items }: { items: DueSoonItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="stack gap-3" aria-labelledby="due-soon-title">
      <h2 id="due-soon-title" className="section-title">
        Segera Jatuh Tempo
      </h2>
      <ul className="stack gap-2">
        {items.map((item) => (
          <li key={item.id} className="alert-row alert-row-stacked">
            <div className="row-between w-full gap-3">
              <Link href={`/challenge/${item.id}`} className="font-medium alert-row-link">
                {item.title}
              </Link>
              {item.nudge && (
                <span className={`text-sm ${STATUS_CLASS[item.status]}`}>
                  {item.nudge}
                </span>
              )}
            </div>
            {item.status === "extended_overdue" && (
              <OverdueActions
                challengeId={item.id}
                title={item.title}
                deadline={item.deadline}
              />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
