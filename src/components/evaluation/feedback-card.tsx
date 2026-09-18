interface Props {
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export function FeedbackCard({ feedback, strengths, improvements }: Props) {
  return (
    <div className="stack" style={{ gap: "var(--space-4)" }}>
      {feedback && <p style={{ lineHeight: "var(--leading-normal)" }}>{feedback}</p>}

      {strengths.length > 0 && (
        <div className="stack" style={{ gap: "var(--space-2)" }}>
          <h4 className="text-sm" style={{ color: "var(--success)" }}>
            💪 Kekuatan
          </h4>
          <ul className="stack" style={{ gap: "var(--space-1)" }}>
            {strengths.map((item, index) => (
              <li key={`${index}-${item}`} className="text-secondary text-sm">
                ✅ {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {improvements.length > 0 && (
        <div className="stack" style={{ gap: "var(--space-2)" }}>
          <h4 className="text-sm" style={{ color: "var(--warning)" }}>
            🎯 Perlu Diperbaiki
          </h4>
          <ul className="stack" style={{ gap: "var(--space-1)" }}>
            {improvements.map((item, index) => (
              <li key={`${index}-${item}`} className="text-secondary text-sm">
                → {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
