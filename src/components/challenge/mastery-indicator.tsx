import type { MasteryState } from "@/types";

import { MasteryMeter } from "./mastery-meter";

/** Compact mastery meter for cards and headers (DESIGN.md §10). */
export function MasteryIndicator({ state }: { state: MasteryState }) {
  return <MasteryMeter state={state} compact />;
}
