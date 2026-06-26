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
    <div className="card stack" style={{ gap: "var(--space-4)" }}>
      <h3>📈 Progress</h3>
      <div className="hist-bars">
        {history.map((entry) => {
          const score = entry.score ?? 0;
          const isCurrent = entry.attemptNumber === currentAttemptNumber;
          return (
            <div key={entry.attemptNumber} className="hist-col">
              <span className="text-sm font-semibold">
                {entry.score ?? "—"}
              </span>
              <div
                className="hist-bar"
                style={{ opacity: isCurrent ? 1 : 0.55 }}
              >
                <div
                  className="hist-bar-fill"
                  style={{
                    height: `${score * 10}%`,
                    background: scoreColor(score),
                  }}
                />
              </div>
              <span
                className="text-muted text-sm"
                style={isCurrent ? { color: "var(--accent-primary)" } : undefined}
              >
                #{entry.attemptNumber}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
