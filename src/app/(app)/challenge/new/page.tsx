import type { Metadata } from "next";

import { NewChallengeView } from "@/components/challenge/new-challenge-view";

export const metadata: Metadata = {
  title: "Tantangan Baru",
};

export default function NewChallengePage() {
  return <NewChallengeView />;
}
