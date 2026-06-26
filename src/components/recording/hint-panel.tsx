"use client";

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
        <div className="row" style={{ flexWrap: "wrap", gap: "var(--space-2)" }}>
          {keywords.map((kw, index) => (
            <span key={`${index}-${kw}`} className="badge">
              {kw}
            </span>
          ))}
        </div>
      );
    }
    if (level === "guiding_questions") {
      return (
        <ul className="stack" style={{ gap: "var(--space-1)" }}>
          {questions.map((q, index) => (
            <li key={`${index}-${q}`} className="text-secondary text-sm">
              • {q}
            </li>
          ))}
        </ul>
      );
    }
    return (
      <ol className="stack" style={{ gap: "var(--space-2)" }}>
        {outline.map((item, index) => (
          <li key={`${index}-${item.title}`} className="stack" style={{ gap: "2px" }}>
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
    <div className="stack" style={{ gap: "var(--space-3)", width: "100%" }}>
      <div className="row-between">
        <h3 className="text-lg">💡 Butuh bantuan?</h3>
        <span className="badge" title="Skor maksimum saat ini">
          Skor maks: {currentCap}/10
        </span>
      </div>

      {HINT_TIERS.map((tier) => {
        const isRevealed = revealed.has(tier.level);
        return (
          <div
            key={tier.level}
            className="hint-tier"
            data-revealed={isRevealed}
          >
            <div className="row-between">
              <span className="font-semibold">{tier.label}</span>
              {!isRevealed && <span className="badge">maks {tier.cap}</span>}
            </div>

            {isRevealed ? (
              <div style={{ marginTop: "var(--space-2)" }}>
                {renderContent(tier.level)}
              </div>
            ) : (
              <div
                className="stack"
                style={{ gap: "var(--space-2)", marginTop: "var(--space-2)" }}
              >
                <span className="text-secondary text-sm">{tier.description}</span>
                <span className="hint-warning">
                  ⚠️ Membuka hint ini akan membatasi skor maks ke {tier.cap}.
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => onReveal(tier.level)}
                  disabled={disabled}
                  style={{ alignSelf: "flex-start" }}
                >
                  Buka hint
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
