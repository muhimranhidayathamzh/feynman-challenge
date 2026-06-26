import type { Coverage, CoverageStatus } from "@/types";

const STATUS_META: Record<CoverageStatus, { icon: string; color: string }> = {
  covered: { icon: "✅", color: "var(--success)" },
  partial: { icon: "⚠️", color: "var(--warning)" },
  missing: { icon: "❌", color: "var(--error)" },
};

export function CoverageChecklist({ items }: { items: Coverage[] }) {
  if (items.length === 0) return null;

  return (
    <ul>
      {items.map((item, index) => {
        const meta = STATUS_META[item.status];
        return (
          <li key={`${index}-${item.topic}`} className="coverage-row">
            <span aria-hidden="true">{meta.icon}</span>
            <div className="stack" style={{ gap: "2px" }}>
              <span className="font-medium" style={{ color: meta.color }}>
                {item.topic}
              </span>
              {item.note && (
                <span className="text-secondary text-sm">{item.note}</span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
