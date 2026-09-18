import { formatClock, timerAnnouncement } from "@/lib/utils/timer";

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
    <>
      {/* role="timer" is not live: screen readers read the current value when
          the user navigates to it, but it never interrupts every second. */}
      <div
        className="ring countdown"
        data-almost-done={almostDone}
        role="timer"
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
        <div className="ring-center gap-1">
          <span className="countdown-value">{formatClock(remaining)}</span>
          <span className="text-muted text-sm">tersisa</span>
        </div>
      </div>
      {/* Announced only when the milestone text changes (1 min, 15 s left). */}
      <span className="visually-hidden" aria-live="polite">
        {timerAnnouncement(remaining, totalSeconds)}
      </span>
    </>
  );
}
