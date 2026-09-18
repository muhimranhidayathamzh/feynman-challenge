import { MASTERY_META } from "@/lib/utils/labels";
import type { MasteryState } from "@/types";

export function MasteryIndicator({ state }: { state: MasteryState }) {
  const meta = MASTERY_META[state];

  return (
    <span className="badge" title={`Tingkat penguasaan: ${meta.label}`}>
      {/* The colour is data (one per mastery state), so it stays inline. */}
      <span
        className="mastery-dot"
        aria-hidden="true"
        style={{ background: meta.color }}
      />
      {meta.label}
    </span>
  );
}
