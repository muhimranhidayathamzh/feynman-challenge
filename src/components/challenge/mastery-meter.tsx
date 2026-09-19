import { MASTERY_META } from "@/lib/utils/labels";
import { MASTERY_LEVELS, masteryLevel } from "@/lib/utils/mastery";
import { cx } from "@/lib/utils/cx";
import type { MasteryState } from "@/types";

/** Meter segment i (1-based) is inked with the colour of that level. */
const SEGMENT_STATE: MasteryState[] = [
  "attempted",
  "developing",
  "proficient",
  "mastered",
  "solidified",
];

interface Props {
  state: MasteryState;
  /** Small inline version for cards and headers. */
  compact?: boolean;
  className?: string;
}

/**
 * Mastery as ink filling five segments (DESIGN.md §4, §10): growth, not a
 * red-to-green verdict. The label and level are always written, because the
 * lowest segments are deliberately pale.
 */
export function MasteryMeter({ state, compact = false, className }: Props) {
  const level = masteryLevel(state);
  const label = MASTERY_META[state].label;
  const levelText =
    level === 0 ? "belum ada percobaan" : `level ${level} dari ${MASTERY_LEVELS}`;

  return (
    <span
      className={cx("mastery-meter", compact && "mastery-meter-compact", className)}
      role="img"
      aria-label={`Penguasaan: ${label}, ${levelText}`}
    >
      <span className="mastery-meter-label" aria-hidden="true">
        <span className="font-semibold">{label}</span>
        {!compact && <span className="text-muted"> · {levelText}</span>}
      </span>
      <span className="mastery-meter-track" aria-hidden="true">
        {SEGMENT_STATE.map((segment, index) => (
          <span
            key={segment}
            className="mastery-meter-segment"
            data-filled={index < level || undefined}
            style={
              index < level ? { background: MASTERY_META[segment].color } : undefined
            }
          />
        ))}
      </span>
    </span>
  );
}
