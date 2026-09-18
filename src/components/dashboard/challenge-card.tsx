import Link from "next/link";

import { DeadlineBadge } from "@/components/challenge/deadline-badge";
import { MasteryIndicator } from "@/components/challenge/mastery-indicator";
import type { DeadlineInfo } from "@/lib/utils/deadline";
import { MASTERY_META, scoreColor } from "@/lib/utils/labels";
import type { MasteryState } from "@/types";

export interface ChallengeCardData {
  id: string;
  title: string;
  /** Effective (decay-applied) mastery state. */
  masteryState: MasteryState;
  latestScore: number | null;
  deadline: DeadlineInfo;
}

export function ChallengeCard({ challenge }: { challenge: ChallengeCardData }) {
  return (
    <Link
      href={`/challenge/${challenge.id}`}
      className="card card-hover challenge-card stack gap-3"
      // Data-driven colours (mastery state, score band) stay inline.
      style={{ borderLeftColor: MASTERY_META[challenge.masteryState].color }}
    >
      <h3 className="challenge-card-title">{challenge.title}</h3>

      <div className="row flex-wrap gap-2">
        <MasteryIndicator state={challenge.masteryState} />
        <DeadlineBadge info={challenge.deadline} />
      </div>

      {challenge.latestScore !== null && (
        <span
          className="challenge-card-score"
          style={{ color: scoreColor(challenge.latestScore) }}
        >
          {challenge.latestScore}
          <span className="challenge-card-score-max"> / 10</span>
        </span>
      )}
    </Link>
  );
}
