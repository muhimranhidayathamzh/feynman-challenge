import { cx } from "@/lib/utils/cx";

interface Props {
  label: string;
  /** Max score once this hint is open. */
  cap: number;
  revealed: boolean;
  disabled?: boolean;
  onReveal?: () => void;
}

/**
 * A hint whose price is written on it (DESIGN.md §3 "Jujur"): dashed while
 * closed, solid once opened. Opening is permanent for the attempt.
 */
export function HintChip({ label, cap, revealed, disabled = false, onReveal }: Props) {
  const text = (
    <>
      <span className="font-semibold">{label}</span>
      <span className="hint-chip-cap"> · maks {cap}</span>
    </>
  );
  if (revealed || !onReveal) {
    return (
      <span className={cx("hint-chip", revealed && "hint-chip-open")}>
        {text}
        {revealed && <span className="visually-hidden"> (sudah dibuka)</span>}
      </span>
    );
  }
  return (
    <button
      type="button"
      className="hint-chip"
      disabled={disabled}
      onClick={onReveal}
      aria-label={`Buka ${label.toLowerCase()}. Skor maksimal jadi ${cap}.`}
    >
      {text}
    </button>
  );
}
