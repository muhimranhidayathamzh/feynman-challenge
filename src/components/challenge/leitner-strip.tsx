import { leitnerSlots } from "@/lib/utils/review";

interface Props {
  /** challenges.review_box (0-based). */
  box: number;
  /** e.g. "Review berikutnya: 22 Sep" (nextReviewLabel). */
  nextReview?: string | null;
}

/**
 * The Leitner boxes shown as they are (DESIGN.md §10): six boxes with their
 * intervals and the current one inked, so the learner sees why a topic comes
 * back when it does.
 */
export function LeitnerStrip({ box, nextReview = null }: Props) {
  const slots = leitnerSlots(box);
  const current = slots.find((slot) => slot.current);
  return (
    <div className="leitner">
      <ol className="leitner-slots" aria-label="Kotak review">
        {slots.map((slot) => (
          <li
            key={slot.box}
            className="leitner-slot"
            data-current={slot.current || undefined}
            aria-current={slot.current ? "step" : undefined}
          >
            <span className="leitner-number">{slot.box + 1}</span>
            <span className="leitner-days">{slot.days} hari</span>
          </li>
        ))}
      </ol>
      {current && (
        <p className="text-muted text-xs">
          Kotak {current.box + 1} dari {slots.length}: review tiap {current.days} hari.
          {nextReview ? ` ${nextReview}.` : ""}
        </p>
      )}
    </div>
  );
}
