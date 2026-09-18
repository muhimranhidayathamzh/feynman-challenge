import { Book, FileText, Link, ScrollText, Video, type LucideIcon } from "lucide-react";

import type { HintLevel, MasteryState, SourceType } from "@/types";

/** Display metadata for each learning-source type. */
export const SOURCE_TYPE_META: Record<SourceType, { icon: LucideIcon; label: string }> = {
  video: { icon: Video, label: "Video" },
  article: { icon: FileText, label: "Artikel" },
  book: { icon: Book, label: "Buku" },
  paper: { icon: ScrollText, label: "Paper" },
  other: { icon: Link, label: "Lainnya" },
};

/** Display metadata for each mastery state (label + CSS color variable). */
export const MASTERY_META: Record<MasteryState, { label: string; color: string }> = {
  not_started: { label: "Belum Mulai", color: "var(--mastery-not-started)" },
  attempted: { label: "Dicoba", color: "var(--mastery-attempted)" },
  developing: { label: "Berkembang", color: "var(--mastery-developing)" },
  proficient: { label: "Cakap", color: "var(--mastery-proficient)" },
  mastered: { label: "Dikuasai", color: "var(--mastery-mastered)" },
  solidified: { label: "Mantap", color: "var(--mastery-solidified)" },
};

/** Human-friendly recording-duration estimate, e.g. "± 3 menit". */
export function formatDuration(seconds: number): string {
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `± ${minutes} menit`;
}

/** Color for a 0–10 score (red → orange → yellow → green), reusing mastery hues. */
export function scoreColor(score: number): string {
  if (score >= 8) return "var(--mastery-mastered)";
  if (score >= 7) return "var(--mastery-proficient)";
  if (score >= 5) return "var(--mastery-developing)";
  return "var(--mastery-attempted)";
}

// --- Hint tiers (recording screen) ---
// Ordered from least to most helpful; opening a tier caps the max score.
export interface HintTier {
  level: HintLevel;
  cap: number;
  label: string;
  description: string;
}

/** Revealable tiers, in display/help order (excludes the implicit "none"). */
export const HINT_TIERS: HintTier[] = [
  {
    level: "keywords",
    cap: 9,
    label: "Kata Kunci",
    description: "Daftar istilah inti dari outline.",
  },
  {
    level: "guiding_questions",
    cap: 8,
    label: "Pertanyaan Pemandu",
    description: "Pertanyaan yang memandu penjelasanmu.",
  },
  {
    level: "outline",
    cap: 7,
    label: "Outline Lengkap",
    description: "Seluruh poin outline beserta deskripsinya.",
  },
];

/** Max score when no hint is opened. */
export const MAX_SCORE_NO_HINT = 10;

/** Score cap per hint level (server uses this when creating an attempt). */
export const MAX_SCORE_BY_HINT: Record<HintLevel, number> = {
  none: 10,
  keywords: 9,
  guiding_questions: 8,
  outline: 7,
};

/**
 * Given the set of revealed tiers, returns the effective hint level (the most
 * helpful one opened) and its score cap. Defaults to "none" / 10.
 */
export function effectiveHint(revealed: ReadonlySet<HintLevel>): {
  level: HintLevel;
  cap: number;
} {
  let result = { level: "none" as HintLevel, cap: MAX_SCORE_NO_HINT };
  for (const tier of HINT_TIERS) {
    if (revealed.has(tier.level)) {
      result = { level: tier.level, cap: tier.cap };
    }
  }
  return result;
}
