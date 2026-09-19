import { formatClock, timerAnnouncement } from "@/lib/utils/timer";

interface Props {
  totalSeconds: number;
  elapsedSeconds: number;
  /** Before the first start the timer shows the time available, not left. */
  started: boolean;
}

/**
 * The stage clock (DESIGN.md §11): large Newsreader numerals and a thin chalk
 * line that fills as time passes. Turns amber in the last 15 seconds.
 */
export function StageTimer({ totalSeconds, elapsedSeconds, started }: Props) {
  const remaining = Math.max(0, totalSeconds - elapsedSeconds);
  const progress = totalSeconds > 0 ? Math.min(1, elapsedSeconds / totalSeconds) : 0;
  const almostDone = started && remaining <= 15 && remaining > 0;

  return (
    <div className="stage-timer" data-almost-done={almostDone || undefined}>
      {/* role="timer" is not live: screen readers read it when the user
          navigates to it, and it never interrupts every second. */}
      <p className="stage-timer-value" role="timer">
        {formatClock(started ? remaining : totalSeconds)}
      </p>
      <p className="stage-timer-caption">
        {started ? `tersisa dari ${formatClock(totalSeconds)}` : "waktu yang tersedia"}
      </p>
      <div className="stage-progress" aria-hidden="true">
        <span style={{ width: `${progress * 100}%` }} />
      </div>
      {/* Announced only when the milestone text changes (1 min, 15 s left). */}
      <span className="visually-hidden" aria-live="polite">
        {started ? timerAnnouncement(remaining, totalSeconds) : ""}
      </span>
    </div>
  );
}
