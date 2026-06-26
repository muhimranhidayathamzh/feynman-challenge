import { ChallengeCard, type ChallengeCardData } from "./challenge-card";

export function ChallengeList({ challenges }: { challenges: ChallengeCardData[] }) {
  return (
    <div className="dashboard-grid">
      {challenges.map((challenge) => (
        <ChallengeCard key={challenge.id} challenge={challenge} />
      ))}
    </div>
  );
}
