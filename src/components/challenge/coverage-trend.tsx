import Link from "next/link";

import { CoverageMark } from "@/components/evaluation/coverage-mark";
import type { TrendPoint } from "@/lib/utils/coverage-progress";
import { COVERAGE_STATUS_LABEL } from "@/lib/utils/labels";
import type { CoverageStatus } from "@/types";

function statusText(status: CoverageStatus | null): string {
  return status ? COVERAGE_STATUS_LABEL[status].toLowerCase() : "tidak dinilai";
}

/** The same marks as the result page; a faint dot when the point was not assessed. */
function TrendDot({ status, title }: { status: CoverageStatus | null; title?: string }) {
  return (
    <span className="trend-dot" title={title}>
      {status ? (
        <CoverageMark status={status} size={13} decorative />
      ) : (
        <span className="trend-none" />
      )}
    </span>
  );
}

function pointLabel(point: TrendPoint): string {
  return `Percobaan #${point.attemptNumber}: ${statusText(point.status)}`;
}

/**
 * Coverage of one outline point across the last attempts, oldest first.
 * Shape differs per status (filled, half, ring), so it does not rely on color.
 * When the points carry links (Prompt 4.1), each dot opens its attempt and is
 * named on its own; otherwise the row is one image with a summary.
 */
export function CoverageTrend({ points }: { points: TrendPoint[] }) {
  if (points.length === 0) return null;
  const summary = `Cakupan ${points.length} percobaan terakhir`;
  const linked = points.every((point) => point.href !== undefined);

  return (
    <span className="coverage-trend">
      <span className="text-muted text-xs" aria-hidden="true">
        Tren
      </span>
      {linked ? (
        <span className="trend-dots is-linked" role="group" aria-label={summary}>
          {points.map((point) => (
            <Link
              key={point.attemptNumber}
              href={point.href ?? ""}
              className="trend-dot-link"
              aria-label={pointLabel(point)}
              title={pointLabel(point)}
            >
              <TrendDot status={point.status} />
            </Link>
          ))}
        </span>
      ) : (
        <span
          className="trend-dots"
          role="img"
          aria-label={`${summary}: ${points
            .map((point) => `#${point.attemptNumber} ${statusText(point.status)}`)
            .join(", ")}`}
        >
          {points.map((point) => (
            <TrendDot
              key={point.attemptNumber}
              status={point.status}
              title={pointLabel(point)}
            />
          ))}
        </span>
      )}
    </span>
  );
}

/** Legend for the trend dots, shown once above the outline. */
export function CoverageTrendLegend() {
  const statuses: CoverageStatus[] = ["covered", "partial", "missing"];
  return (
    <p className="trend-legend text-muted text-xs">
      <span>Titik tren = cakupan tiap poin di 5 percobaan terakhir:</span>
      {statuses.map((status) => (
        <span key={status} className="trend-legend-item">
          <TrendDot status={status} />
          {COVERAGE_STATUS_LABEL[status]}
        </span>
      ))}
    </p>
  );
}
