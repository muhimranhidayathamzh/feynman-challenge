import type { Coverage, CoverageStatus } from "@/types";

const STATUS_META: Record<
  CoverageStatus,
  { icon: string; color: string; label: string }
> = {
  covered: { icon: "✅", color: "var(--success)", label: "Tercakup" },
  partial: { icon: "⚠️", color: "var(--warning)", label: "Sebagian" },
  missing: { icon: "❌", color: "var(--error)", label: "Belum dibahas" },
};

export function CoverageChecklist({ items }: { items: Coverage[] }) {
  if (items.length === 0) return null;

  return (
    <ul>
      {items.map((item, index) => {
        const meta = STATUS_META[item.status];
        return (
          <li key={`${index}-${item.topic}`} className="coverage-row">
            <span role="img" aria-label={meta.label}>
              {meta.icon}
            </span>
            <div className="stack" style={{ gap: "var(--space-1)" }}>
              <span className="font-medium" style={{ color: meta.color }}>
                {item.topic}
              </span>
              {item.note && <span className="text-secondary text-sm">{item.note}</span>}
              {item.evidence && (
                <blockquote className="coverage-evidence text-sm">
                  “{item.evidence}”
                </blockquote>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
