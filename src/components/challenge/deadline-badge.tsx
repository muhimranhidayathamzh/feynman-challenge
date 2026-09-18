import { daysUntil } from "@/lib/utils/deadline";

function describe(days: number): { text: string; color: string } {
  if (days < 0) return { text: "Terlewat", color: "var(--error)" };
  if (days === 0) return { text: "Hari ini", color: "var(--warning)" };
  if (days === 1) return { text: "Besok", color: "var(--warning)" };
  return { text: `${days} hari lagi`, color: "var(--text-secondary)" };
}

export function DeadlineBadge({
  deadline,
  extendedDeadline,
}: {
  deadline: string | null;
  extendedDeadline: string | null;
}) {
  const effective = extendedDeadline ?? deadline;
  if (!effective) return null;

  const { text, color } = describe(daysUntil(effective));

  return (
    <span className="badge" style={{ color }} title="Deadline">
      📅 {text}
      {extendedDeadline ? <span className="text-muted"> · diperpanjang</span> : null}
    </span>
  );
}
