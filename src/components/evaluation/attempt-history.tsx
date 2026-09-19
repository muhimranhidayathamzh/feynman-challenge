import { Sheet, SheetTitle } from "@/components/ui/sheet";
import { cx } from "@/lib/utils/cx";
import { scoreColor } from "@/lib/utils/labels";

interface HistoryEntry {
  attemptNumber: number;
  score: number | null;
}

interface Props {
  history: HistoryEntry[];
  currentAttemptNumber: number;
}

export function AttemptHistory({ history, currentAttemptNumber }: Props) {
  // Only meaningful once there's more than one attempt to compare.
  if (history.length <= 1) return null;

  return (
    <Sheet className="stack gap-4">
      <SheetTitle>Perkembangan</SheetTitle>
      <div className="hist-bars">
        {history.map((entry) => {
          const score = entry.score ?? 0;
          const isCurrent = entry.attemptNumber === currentAttemptNumber;
          return (
            <div
              key={entry.attemptNumber}
              className={cx("hist-col", isCurrent && "is-current")}
              aria-current={isCurrent ? "true" : undefined}
            >
              <span className="text-sm font-semibold">{entry.score ?? "—"}</span>
              <div className="hist-bar">
                {/* Height and colour are data, so they stay inline. */}
                <div
                  className="hist-bar-fill"
                  style={{ height: `${score * 10}%`, background: scoreColor(score) }}
                />
              </div>
              <span className="hist-label text-sm">#{entry.attemptNumber}</span>
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}
