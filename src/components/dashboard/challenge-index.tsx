import Link from "next/link";

import { DeadlineBadge } from "@/components/challenge/deadline-badge";
import { MasteryMeter } from "@/components/challenge/mastery-meter";
import type { ChallengeCardData } from "@/lib/utils/dashboard";

export type { ChallengeCardData };

/** The challenge list as a book index: title first, state in small print. */
export function ChallengeIndex({ challenges }: { challenges: ChallengeCardData[] }) {
  return (
    <ol className="challenge-index">
      {challenges.map((challenge) => (
        <li key={challenge.id}>
          <Link href={`/challenge/${challenge.id}`} className="challenge-row">
            <span className="challenge-row-main">
              <span className="challenge-row-title">{challenge.title}</span>
              <span className="challenge-row-meta">
                <MasteryMeter state={challenge.masteryState} compact />
                <DeadlineBadge info={challenge.deadline} />
                {challenge.review && (
                  <span className="text-muted text-xs">{challenge.review}</span>
                )}
              </span>
            </span>
            {challenge.latestScore !== null && (
              <span className="challenge-row-score">
                {challenge.latestScore}
                <span className="challenge-row-score-max"> /10</span>
              </span>
            )}
          </Link>
        </li>
      ))}
    </ol>
  );
}
