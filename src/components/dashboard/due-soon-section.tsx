import Link from "next/link";
import { Zap } from "lucide-react";

import { Icon } from "@/components/ui/icon";
import type { DeadlineStatus } from "@/lib/utils/deadline";

export interface DueSoonItem {
  id: string;
  title: string;
  status: DeadlineStatus;
  nudge: string | null;
}

const STATUS_CLASS: Record<DeadlineStatus, string> = {
  none: "text-secondary",
  upcoming: "text-secondary",
  due_soon: "text-warning",
  due_today: "text-warning",
  overdue: "text-error",
  extended_overdue: "text-error",
};

export function DueSoonSection({ items }: { items: DueSoonItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="stack gap-3" aria-labelledby="due-soon-title">
      <h2 id="due-soon-title" className="section-title">
        <Icon icon={Zap} size={20} />
        Due Soon
      </h2>
      <div className="stack gap-2">
        {items.map((item) => (
          <Link key={item.id} href={`/challenge/${item.id}`} className="alert-row">
            <span className="font-medium">{item.title}</span>
            {item.nudge && (
              <span className={`text-sm nowrap ${STATUS_CLASS[item.status]}`}>
                {item.nudge}
              </span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
