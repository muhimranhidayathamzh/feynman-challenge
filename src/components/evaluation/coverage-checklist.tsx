import { BookOpen } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { studyHref } from "@/lib/utils/coverage-progress";
import type { Coverage, CoverageStatus } from "@/types";

import { CoverageMark } from "./coverage-mark";

/** A coverage entry linked to the current outline item (null if it is gone). */
export type CoverageRow = Coverage & { outline_id: string | null };

/** Text colour per status. "Missing" is a gap to fill, not an error: muted. */
export const COVERAGE_STATUS_META: Record<CoverageStatus, { className: string }> = {
  covered: { className: "text-success" },
  partial: { className: "text-warning" },
  missing: { className: "text-muted" },
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
            <CoverageMark status={item.status} />
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
