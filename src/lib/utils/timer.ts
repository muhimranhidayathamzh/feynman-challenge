// Recording countdown helpers — pure, client-safe.

/** "MM:SS", never negative. */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * What a screen reader should hear about the countdown, or null for silence.
 * The text only changes at two milestones (1 minute and 15 seconds left), so a
 * polite live region announces exactly twice instead of every second. The
 * 1-minute milestone is skipped for recordings that are a minute or shorter.
 */
export function timerAnnouncement(
  remainingSeconds: number,
  totalSeconds: number,
): string | null {
  if (remainingSeconds <= 0) return null;
  if (remainingSeconds <= 15) return "Sisa 15 detik.";
  if (remainingSeconds <= 60 && totalSeconds > 60) return "Sisa 1 menit.";
  return null;
}
