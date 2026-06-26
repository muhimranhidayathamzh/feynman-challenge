interface Props {
  streakCount: number;
  bestStreak: number;
}

export function StreakDisplay({ streakCount, bestStreak }: Props) {
  return (
    <div className="streak-chip" title="Streak harian">
      <span style={{ fontSize: "var(--text-xl)" }} aria-hidden="true">
        🔥
      </span>
      <div className="stack" style={{ gap: 0 }}>
        <span className="font-bold">
          {streakCount} <span className="text-secondary font-medium">hari</span>
        </span>
        {bestStreak > 0 && (
          <span className="text-muted text-sm">Terbaik: {bestStreak}</span>
        )}
      </div>
    </div>
  );
}
