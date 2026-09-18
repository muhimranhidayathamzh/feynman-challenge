import { Flame } from "lucide-react";

import { Icon } from "@/components/ui/icon";

interface Props {
  streakCount: number;
  bestStreak: number;
}

export function StreakDisplay({ streakCount, bestStreak }: Props) {
  return (
    <div className="streak-chip" title="Streak harian">
      <Icon icon={Flame} size={24} className="streak-icon" />
      <div className="stack gap-0">
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
