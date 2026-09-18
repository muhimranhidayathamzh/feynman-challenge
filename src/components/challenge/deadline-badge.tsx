import { CalendarClock } from "lucide-react";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import type { DeadlineInfo } from "@/lib/utils/deadline";

/**
 * Presentational only. The DeadlineInfo is computed on the server with the
 * user's timezone (see getDeadlineInfo + getUserClock) and passed down, so
 * server and client always render the same day.
 */
function describe(info: DeadlineInfo): { text: string; tone: BadgeTone } | null {
  if (info.status === "none" || info.daysUntil === null) return null;
  const days = info.daysUntil;
  if (days < 0) return { text: "Terlewat", tone: "error" };
  if (days === 0) return { text: "Hari ini", tone: "warning" };
  if (days === 1) return { text: "Besok", tone: "warning" };
  return { text: `${days} hari lagi`, tone: "neutral" };
}

export function DeadlineBadge({ info }: { info: DeadlineInfo }) {
  const described = describe(info);
  if (!described) return null;

  return (
    <Badge tone={described.tone} icon={CalendarClock} title="Deadline">
      {described.text}
      {info.isExtended ? <span className="text-muted"> · diperpanjang</span> : null}
    </Badge>
  );
}
