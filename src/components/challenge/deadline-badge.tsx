import type { DeadlineInfo } from "@/lib/utils/deadline";

/**
 * Presentational only. The DeadlineInfo is computed on the server with the
 * user's timezone (see getDeadlineInfo + getUserClock) and passed down, so
 * server and client always render the same day.
 */
function describe(info: DeadlineInfo): { text: string; color: string } | null {
  if (info.status === "none" || info.daysUntil === null) return null;
  const days = info.daysUntil;
  if (days < 0) return { text: "Terlewat", color: "var(--error)" };
  if (days === 0) return { text: "Hari ini", color: "var(--warning)" };
  if (days === 1) return { text: "Besok", color: "var(--warning)" };
  return { text: `${days} hari lagi`, color: "var(--text-secondary)" };
}

export function DeadlineBadge({ info }: { info: DeadlineInfo }) {
  const described = describe(info);
  if (!described) return null;

  return (
    <span className="badge" style={{ color: described.color }} title="Deadline">
      📅 {described.text}
      {info.isExtended ? <span className="text-muted"> · diperpanjang</span> : null}
    </span>
  );
}
