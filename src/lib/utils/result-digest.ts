/**
 * Short readings of an evaluation, for the parts of the result page that
 * must stay useful while folded or at a glance (Prompt V.7).
 */

import type { Coverage } from "@/types";

import type { CoverageComparison } from "./coverage-progress";

/** "3 sudah kuat · 2 bisa lebih baik · 1 istilah belum dijelaskan". */
export function notesSummary(
  strengths: number,
  improvements: number,
  jargon: number,
): string {
  return [
    strengths > 0 && `${strengths} sudah kuat`,
    improvements > 0 && `${improvements} bisa lebih baik`,
    jargon > 0 && `${jargon} istilah belum dijelaskan`,
  ]
    .filter((part): part is string => Boolean(part))
    .join(" · ");
}

/** "2 membaik · 1 masih kurang · 1 tetap tercakup". */
export function comparisonSummary(comparison: CoverageComparison): string {
  const { improved, declined, stillWeak, steadyCount } = comparison;
  return [
    improved.length > 0 && `${improved.length} membaik`,
    declined.length > 0 && `${declined.length} menurun`,
    stillWeak.length > 0 && `${stillWeak.length} masih kurang`,
    steadyCount > 0 && `${steadyCount} tetap tercakup`,
  ]
    .filter((part): part is string => Boolean(part))
    .join(" · ");
}

/**
 * The one thing to work on before the next attempt, pulled to the top of
 * the result page.
 *
 * The evaluator's first improvement wins: it is written for this attempt
 * and says what to do, not only what is missing. Without one, fall back to
 * the weakest point (a missing point before a partial one). A fully covered
 * explanation with nothing to improve has no focus, and returns null rather
 * than inventing one.
 */
export function nextFocus(
  improvements: readonly string[],
  coverage: readonly Pick<Coverage, "topic" | "status">[],
): string | null {
  const first = improvements.find((item) => item.trim().length > 0);
  if (first) return first.trim();

  const missing = coverage.find((point) => point.status === "missing");
  if (missing) return `Bahas ${missing.topic} di percobaan berikutnya.`;

  const partial = coverage.find((point) => point.status === "partial");
  if (partial) return `Lengkapi penjelasanmu tentang ${partial.topic}.`;

  return null;
}
