import Link from "next/link";

import { DeadlineBadge } from "@/components/challenge/deadline-badge";
import { MasteryIndicator } from "@/components/challenge/mastery-indicator";
import { MASTERY_META, scoreColor } from "@/lib/utils/labels";
import type { MasteryState } from "@/types";

export interface ChallengeCardData {
  id: string;
  title: string;
  masteryState: MasteryState;
  latestScore: number | null;
  deadline: string | null;
  extendedDeadline: string | null;
}

export function ChallengeCard({ challenge }: { challenge: ChallengeCardData }) {
  return (
    <Link
      href={`/challenge/${challenge.id}`}
      className="card card-hover challenge-card stack"
      style={{
        gap: "var(--space-3)",
        borderLeftColor: MASTERY_META[challenge.masteryState].color,
      }}
    >
      <h3 style={{ fontSize: "var(--text-lg)" }}>{challenge.title}</h3>

      <div className="row" style={{ gap: "var(--space-2)", flexWrap: "wrap" }}>
        <MasteryIndicator state={challenge.masteryState} />
        <DeadlineBadge
          deadline={challenge.deadline}
          extendedDeadline={challenge.extendedDeadline}
        />
      </div>

      {challenge.latestScore !== null && (
        <span
          className="font-bold"
          style={{
            fontSize: "var(--text-2xl)",
            color: scoreColor(challenge.latestScore),
          }}
        >
          {challenge.latestScore}
          <span className="text-muted font-medium" style={{ fontSize: "var(--text-base)" }}>
            {" "}
            / 10
          </span>
        </span>
      )}
    </Link>
  );
}
