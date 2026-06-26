import { MASTERY_META } from "@/lib/utils/labels";
import type { MasteryState } from "@/types";

export function MasteryIndicator({ state }: { state: MasteryState }) {
  const meta = MASTERY_META[state];

  return (
    <span className="badge" title={`Mastery: ${meta.label}`}>
      <span
        aria-hidden="true"
        style={{
          width: "0.6rem",
          height: "0.6rem",
          borderRadius: "var(--radius-full)",
          background: meta.color,
          display: "inline-block",
        }}
      />
      {meta.label}
    </span>
  );
}
