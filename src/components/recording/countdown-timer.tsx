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

  return (
    <div
      className="ring countdown"
      data-almost-done={almostDone}
      role="timer"
      aria-label={`${formatClock(remaining)} tersisa`}
      style={{ width: SIZE, height: SIZE }}
    >
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        aria-hidden="true"
        focusable="false"
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--bg-tertiary)"
          strokeWidth={STROKE}
        />
        <circle
          className="countdown-progress"
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE - offset}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </svg>
      <div className="ring-center gap-1" aria-hidden="true">
        <span className="countdown-value">{formatClock(remaining)}</span>
        <span className="text-muted text-sm">tersisa</span>
      </div>
    </div>
  );
}
