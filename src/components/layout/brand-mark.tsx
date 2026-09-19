import {
  MARK_LEGS,
  MARK_LEGS_STROKE,
  MARK_VERTEX,
  MARK_WAVE,
  MARK_WAVE_STROKE,
} from "@/lib/brand/mark";
import { cx } from "@/lib/utils/cx";

interface Props {
  size?: number;
  className?: string;
  /** Accessible name; omit when a visible name sits next to the mark. */
  title?: string;
}

/**
 * The Feynman-diagram mark. Lines use the current text colour and the wave
 * uses the accent, so it adapts to Kertas and Papan Tulis automatically.
 */
export function BrandMark({ size = 24, className, title }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={cx("brand-mark", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={MARK_LEGS} stroke="currentColor" strokeWidth={MARK_LEGS_STROKE} />
      <path d={MARK_WAVE} stroke="var(--accent)" strokeWidth={MARK_WAVE_STROKE} />
      <circle
        cx={MARK_VERTEX.cx}
        cy={MARK_VERTEX.cy}
        r={MARK_VERTEX.r}
        fill="currentColor"
      />
    </svg>
  );
}
