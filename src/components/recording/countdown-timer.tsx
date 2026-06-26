function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

interface Props {
  totalSeconds: number;
  elapsedSeconds: number;
}

const SIZE = 200;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CountdownTimer({ totalSeconds, elapsedSeconds }: Props) {
  const remaining = Math.max(0, totalSeconds - elapsedSeconds);
  const progress = totalSeconds > 0 ? Math.min(1, elapsedSeconds / totalSeconds) : 0;
  const offset = CIRCUMFERENCE * progress;
  const almostDone = remaining <= 15 && remaining > 0;
  const ringColor = almostDone ? "var(--warning)" : "var(--accent-primary)";

  return (
    <div
      style={{ position: "relative", width: SIZE, height: SIZE }}
      role="timer"
      aria-label={`${formatClock(remaining)} tersisa`}
    >
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--bg-tertiary)"
          strokeWidth={STROKE}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={ringColor}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE - offset}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          style={{ transition: "stroke-dashoffset 0.3s linear, stroke 0.3s" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "var(--space-1)",
        }}
      >
        <span
          style={{
            fontSize: "var(--text-4xl)",
            fontWeight: "var(--weight-bold)",
            fontVariantNumeric: "tabular-nums",
            color: almostDone ? "var(--warning)" : "var(--text-primary)",
          }}
        >
          {formatClock(remaining)}
        </span>
        <span className="text-muted text-sm">tersisa</span>
      </div>
    </div>
  );
}
