import {
  BookOpen,
  CircleAlert,
  CircleCheck,
  CircleX,
  type LucideIcon,
} from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { studyHref } from "@/lib/utils/coverage-progress";
import { COVERAGE_STATUS_LABEL } from "@/lib/utils/labels";
import type { Coverage, CoverageStatus } from "@/types";

/** A coverage entry linked to the current outline item (null if it is gone). */
export type CoverageRow = Coverage & { outline_id: string | null };

export const COVERAGE_STATUS_META: Record<
  CoverageStatus,
  { icon: LucideIcon; className: string }
> = {
  covered: { icon: CircleCheck, className: "text-success" },
  partial: { icon: CircleAlert, className: "text-warning" },
  missing: { icon: CircleX, className: "text-error" },
};

interface Props {
  items: CoverageRow[];
  challengeId: string;
}

export function CoverageChecklist({ items, challengeId }: Props) {
  if (items.length === 0) return null;

  return (
    <ul>
      {items.map((item, index) => {
        const meta = COVERAGE_STATUS_META[item.status];
        return (
          <li key={`${index}-${item.topic}`} className="coverage-row">
            <Icon
              icon={meta.icon}
              size={18}
              label={COVERAGE_STATUS_LABEL[item.status]}
              className={meta.className}
            />
            <div className="stack flex-1 gap-1">
              <span className={`font-medium ${meta.className}`}>{item.topic}</span>
              {item.note && <span className="text-secondary text-sm">{item.note}</span>}
              {item.evidence && (
                <blockquote className="coverage-evidence text-sm">
                  “{item.evidence}”
                </blockquote>
              )}
              {item.status !== "covered" && item.outline_id !== null && (
                <ButtonLink
                  href={studyHref(challengeId, item.outline_id)}
                  variant="ghost"
                  size="sm"
                  icon={BookOpen}
                  className="self-start"
                  aria-label={`Pelajari lagi: ${item.topic}`}
                >
                  Pelajari lagi
                </ButtonLink>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
