interface Props {
  history: { attemptNumber: number; score: number | null }[];
  currentAttemptNumber: number;
}

/**
 * A one-line score history ("#1 6 · #2 7"), replacing the old bar chart.
 * The full attempt history lives in the notebook (Prompt 4.1).
 */
export function ScoreHistory({ history, currentAttemptNumber }: Props) {
  const scored = history.filter((entry) => entry.score !== null);
  if (scored.length < 2) return null;
  return (
    <p className="score-history text-sm">
      <span className="text-muted">Riwayat skor</span>
      {scored.map((entry) => (
        <span
          key={entry.attemptNumber}
          className="score-history-item"
          data-current={entry.attemptNumber === currentAttemptNumber || undefined}
        >
          <span className="text-muted">#{entry.attemptNumber}</span> {entry.score}
        </span>
      ))}
    </p>
  );
}
