"use client";

import { HINT_TIERS } from "@/lib/utils/labels";
import type { HintLevel } from "@/types";

import { HintChip } from "./hint-chip";

export interface OutlinePoint {
  title: string;
  description: string | null;
}

interface Props {
  keywords: string[];
  questions: string[];
  outline: OutlinePoint[];
  revealed: ReadonlySet<HintLevel>;
  currentCap: number;
  onReveal: (level: HintLevel) => void;
}

const SHORT_LABEL: Record<HintLevel, string> = {
  none: "",
  keywords: "Kata kunci",
  guiding_questions: "Pertanyaan",
  outline: "Outline",
};

/**
 * Hints on the stage (DESIGN.md §3 "Jujur"): three chips with their price
 * written on them. Opened hints show their content below; nothing else
 * competes for attention while the learner talks.
 */
export function StageHints({
  keywords,
  questions,
  outline,
  revealed,
  currentCap,
  onReveal,
}: Props) {
  return (
    <section className="stage-hints" aria-labelledby="stage-hints-title">
      <div className="stage-hints-head">
        <h2 id="stage-hints-title" className="stage-hints-title">
          Butuh bantuan?
        </h2>
        <span className="text-muted text-xs">Skor maks sekarang {currentCap}</span>
      </div>
      <div className="stage-hint-chips">
        {HINT_TIERS.map((tier) => (
          <HintChip
            key={tier.level}
            label={SHORT_LABEL[tier.level]}
            cap={tier.cap}
            revealed={revealed.has(tier.level)}
            onReveal={() => onReveal(tier.level)}
          />
        ))}
      </div>

      {revealed.has("keywords") && (
        <div className="stage-hint-body">
          <ul className="stage-keywords">
            {keywords.map((keyword, index) => (
              <li key={`${index}-${keyword}`}>{keyword}</li>
            ))}
          </ul>
        </div>
      )}
      {revealed.has("guiding_questions") && (
        <div className="stage-hint-body">
          <ul className="stage-questions">
            {questions.map((question, index) => (
              <li key={`${index}-${question}`}>{question}</li>
            ))}
          </ul>
        </div>
      )}
      {revealed.has("outline") && (
        <div className="stage-hint-body">
          <ol className="stage-outline">
            {outline.map((item, index) => (
              <li key={`${index}-${item.title}`}>
                <span className="font-semibold">{item.title}</span>
                {item.description && (
                  <span className="text-muted text-sm"> {item.description}</span>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
