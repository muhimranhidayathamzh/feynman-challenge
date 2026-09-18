import { CircleAlert, CircleCheck, CircleX, type LucideIcon } from "lucide-react";

import { Icon } from "@/components/ui/icon";
import type { Coverage, CoverageStatus } from "@/types";

const STATUS_META: Record<
  CoverageStatus,
  { icon: LucideIcon; className: string; label: string }
> = {
  covered: { icon: CircleCheck, className: "text-success", label: "Tercakup" },
  partial: { icon: CircleAlert, className: "text-warning", label: "Sebagian" },
  missing: { icon: CircleX, className: "text-error", label: "Belum dibahas" },
};

export function CoverageChecklist({ items }: { items: Coverage[] }) {
  if (items.length === 0) return null;

  return (
    <ul>
      {items.map((item, index) => {
        const meta = STATUS_META[item.status];
        return (
          <li key={`${index}-${item.topic}`} className="coverage-row">
            <Icon
              icon={meta.icon}
              size={18}
              label={meta.label}
              className={meta.className}
            />
            <div className="stack gap-1">
              <span className={`font-medium ${meta.className}`}>{item.topic}</span>
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
