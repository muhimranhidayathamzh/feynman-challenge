import Link from "next/link";

import { DeadlineBadge } from "@/components/challenge/deadline-badge";
import { MasteryIndicator } from "@/components/challenge/mastery-indicator";
import type { ChallengeCardData } from "@/lib/utils/dashboard";

export type { ChallengeCardData };

export function ChallengeCard({ challenge }: { challenge: ChallengeCardData }) {
  return (
    <Link
      href={`/challenge/${challenge.id}`}
      className="sheet sheet-interactive challenge-card stack gap-3"
    >
      <h3 className="challenge-card-title">{challenge.title}</h3>

      <div className="row flex-wrap gap-2">
        <MasteryIndicator state={challenge.masteryState} />
        <DeadlineBadge info={challenge.deadline} />
      </div>

      {challenge.latestScore !== null && (
        <span className="challenge-card-score">
          {challenge.latestScore}
          <span className="challenge-card-score-max"> / 10</span>
        </span>
      )}
    </Link>
  );
}
