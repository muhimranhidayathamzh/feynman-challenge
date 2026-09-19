import { Badge } from "@/components/ui/badge";
import { MAX_SCORE_NO_HINT, scorePhrase } from "@/lib/utils/labels";

interface Props {
  score: number;
  /** Cap from the hints used (10 without hints). */
  max?: number;
  previous?: { score: number; attemptNumber: number } | null;
}

/**
 * The score as a figure a teacher would write: a large Newsreader number, a
 * phrase that says what it means, and the change since the last attempt
 * (DESIGN.md §10). Replaces the gradient ring. A drop is shown neutrally.
 */
export function ScoreFigure({ score, max = MAX_SCORE_NO_HINT, previous = null }: Props) {
  const delta = previous ? score - previous.score : null;
  return (
    <div className="score-figure">
      <p className="score-figure-number">
        <span className="score-figure-value">{score}</span>
        <span className="score-figure-max"> /{max}</span>
      </p>
      <div className="score-figure-meta">
        <p className="score-figure-phrase">{scorePhrase(score)}</p>
        {delta !== null && previous && (
          <Badge tone={delta > 0 ? "success" : "neutral"}>
            {delta > 0
              ? `+${delta} dari #${previous.attemptNumber}`
              : delta < 0
                ? `${delta} dari #${previous.attemptNumber}`
                : `Sama dengan #${previous.attemptNumber}`}
          </Badge>
        )}
        {max < MAX_SCORE_NO_HINT && (
          <p className="text-muted text-xs">
            Maksimal {max} karena petunjuk yang dibuka.
          </p>
        )}
      </div>
    </div>
  );
}
