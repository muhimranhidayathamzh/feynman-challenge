"use client";

import { Lightbulb, LockOpen, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { HINT_TIERS } from "@/lib/utils/labels";
import type { HintLevel } from "@/types";

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
  disabled: boolean;
  onReveal: (level: HintLevel) => void;
}

export function HintPanel({
  keywords,
  questions,
  outline,
  revealed,
  currentCap,
  disabled,
  onReveal,
}: Props) {
  function renderContent(level: HintLevel) {
    if (level === "keywords") {
      return (
        <ul className="row flex-wrap gap-2">
          {keywords.map((keyword, index) => (
            <li key={`${index}-${keyword}`} className="badge">
              {keyword}
            </li>
          ))}
        </ul>
      );
    }
    if (level === "guiding_questions") {
      return (
        <ul className="hint-questions stack gap-1">
          {questions.map((question, index) => (
            <li key={`${index}-${question}`} className="text-secondary text-sm">
              {question}
            </li>
          ))}
        </ul>
      );
    }
    return (
      <ol className="stack gap-2">
        {outline.map((item, index) => (
          <li key={`${index}-${item.title}`} className="stack gap-1">
            <span className="font-medium text-sm">
              {index + 1}. {item.title}
            </span>
            {item.description && (
              <span className="text-muted text-sm">{item.description}</span>
            )}
          </li>
        ))}
      </ol>
    );
  }

  return (
    <section className="stack gap-3 w-full" aria-labelledby="hint-panel-title">
      <div className="row-between">
        <h3 id="hint-panel-title" className="section-title text-lg">
          <Icon icon={Lightbulb} size={18} />
          Butuh bantuan?
        </h3>
        <Badge title="Skor maksimum saat ini">Skor maks: {currentCap}/10</Badge>
      </div>

      {HINT_TIERS.map((tier) => {
        const isRevealed = revealed.has(tier.level);
        return (
          <div key={tier.level} className="hint-tier" data-revealed={isRevealed}>
            <div className="row-between">
              <span className="font-semibold">{tier.label}</span>
              {!isRevealed && <Badge>maks {tier.cap}</Badge>}
            </div>

            {isRevealed ? (
              <div className="mt-2">{renderContent(tier.level)}</div>
            ) : (
              <div className="stack gap-2 mt-2">
                <span className="text-secondary text-sm">{tier.description}</span>
                <span className="hint-warning">
                  <Icon icon={TriangleAlert} size={14} />
                  Membuka hint ini akan membatasi skor maks ke {tier.cap}.
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={LockOpen}
                  className="self-start"
                  onClick={() => onReveal(tier.level)}
                  disabled={disabled}
                >
                  Buka hint
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
