import { ButtonLink } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import type { TodayAction, WaitingItem } from "@/lib/utils/dashboard";
import type { WeekDay } from "@/lib/utils/streak";

import { OverdueActions } from "./overdue-actions";
import { WeekStrip } from "./week-strip";

interface Props {
  action: TodayAction;
  /** Set when the action is a passed deadline: offer to reschedule or park. */
  overdueDeadline?: string | null;
  dateLabel: string;
  week: WeekDay[];
  streak: number;
  alsoWaiting: WaitingItem[];
}

/**
 * "Hari ini" (DESIGN.md §11): one thing to do, the reason it is that thing,
 * and this week at a glance. Everything else that is due is listed below it
 * once, never repeated (audit #4).
 */
export function TodayCard({
  action,
  overdueDeadline = null,
  dateLabel,
  week,
  streak,
  alsoWaiting,
}: Props) {
  return (
    <Sheet as="section" className="today-card" aria-labelledby="today-title">
      <div className="stack gap-3">
        <p className="today-eyebrow">Hari ini · {dateLabel}</p>
        <h2 id="today-title" className="today-headline">
          {action.headline}
        </h2>
        <p className="text-secondary">{action.reason}</p>
        <div className="row flex-wrap gap-2">
          <ButtonLink href={action.href} size="lg">
            {action.cta}
          </ButtonLink>
          {action.challengeId && action.kind !== "continue" && (
            <ButtonLink href={`/challenge/${action.challengeId}`} variant="ghost">
              Buka catatan
            </ButtonLink>
          )}
        </div>
        {action.kind === "overdue" && action.challengeId && (
          <OverdueActions
            challengeId={action.challengeId}
            title={action.headline}
            deadline={overdueDeadline}
          />
        )}
      </div>

      <div className="today-side">
        <WeekStrip days={week} streak={streak} />
        {alsoWaiting.length > 0 && (
          <div className="stack gap-2">
            <h3 className="notes-heading">Juga menunggu</h3>
            <ul className="waiting-list">
              {alsoWaiting.map((item) => (
                <li key={item.id}>
                  <a href={`/challenge/${item.id}`} className="waiting-link">
                    <span className="font-medium">{item.title}</span>
                    <span className="text-muted text-xs">{item.reason}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Sheet>
  );
}
