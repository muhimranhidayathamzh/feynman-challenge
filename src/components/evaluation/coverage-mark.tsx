import { COVERAGE_STATUS_LABEL } from "@/lib/utils/labels";
import { cx } from "@/lib/utils/cx";
import type { CoverageStatus } from "@/types";

interface Props {
  status: CoverageStatus;
  size?: number;
  /** Hide from screen readers when the status is already written next to it. */
  decorative?: boolean;
  className?: string;
}

/**
 * How well one outline point was explained (DESIGN.md §10). The three shapes
 * differ (filled with a tick, half-filled, dashed ring), so the mark never
 * relies on colour alone.
 */
export function CoverageMark({
  status,
  size = 18,
  decorative = false,
  className,
}: Props) {
  const label = COVERAGE_STATUS_LABEL[status];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      className={cx("coverage-mark", `coverage-mark-${status}`, className)}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative || undefined}
      focusable="false"
    >
      {status === "covered" && (
        <>
          <circle cx="9" cy="9" r="8" fill="currentColor" />
          <path
            d="M5.4 9.3l2.4 2.3 4.8-5.1"
            fill="none"
            stroke="var(--surface)"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
      {status === "partial" && (
        <>
          <circle
            cx="9"
            cy="9"
            r="7.25"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path d="M9 1.75a7.25 7.25 0 0 1 0 14.5z" fill="currentColor" />
        </>
      )}
      {status === "missing" && (
        <circle
          cx="9"
          cy="9"
          r="7.25"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="3 2.6"
        />
      )}
    </svg>
  );
}
