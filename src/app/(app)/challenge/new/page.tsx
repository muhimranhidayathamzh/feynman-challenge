import type { Metadata } from "next";

import { NewChallengeView } from "@/components/challenge/new-challenge-view";

export const metadata: Metadata = {
  title: "Tantangan baru",
};

export default function NewChallengePage() {
  return <NewChallengeView />;
}
