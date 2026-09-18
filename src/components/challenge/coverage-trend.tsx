import type { TrendPoint } from "@/lib/utils/coverage-progress";
import { COVERAGE_STATUS_LABEL } from "@/lib/utils/labels";
import type { CoverageStatus } from "@/types";

function statusText(status: CoverageStatus | null): string {
  return status ? COVERAGE_STATUS_LABEL[status].toLowerCase() : "tidak dinilai";
}

function TrendDot({ status, title }: { status: CoverageStatus | null; title?: string }) {
  return <span className={`trend-dot trend-dot-${status ?? "none"}`} title={title} />;
}

/**
 * Coverage of one outline point across the last attempts, oldest first.
 * Shape differs per status (filled, half, ring), so it does not rely on color.
 */
export function CoverageTrend({ points }: { points: TrendPoint[] }) {
  if (points.length === 0) return null;
  const description = points
    .map((point) => `#${point.attemptNumber} ${statusText(point.status)}`)
    .join(", ");

  return (
    <span className="coverage-trend">
      <span className="text-muted text-xs" aria-hidden="true">
        Tren
      </span>
      <span
        className="trend-dots"
        role="img"
        aria-label={`Cakupan ${points.length} percobaan terakhir: ${description}`}
      >
        {points.map((point) => (
          <TrendDot
            key={point.attemptNumber}
            status={point.status}
            title={`Percobaan #${point.attemptNumber}: ${statusText(point.status)}`}
          />
        ))}
      </span>
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
