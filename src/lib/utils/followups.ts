// ============================================================================
// Socratic follow-up questions — pure helpers.
// The evaluation call returns 1–2 questions aimed at the weakest outline
// point; the learner answers each by voice and gets a light verdict.
// ============================================================================
import type { Json } from "@/types";

export const MAX_FOLLOW_UPS = 2;
const MAX_QUESTION_LENGTH = 300;

// A type alias (not an interface) so it is assignable to the Json column type.
export type FollowUpQuestion = {
  question: string;
  /** 1-based outline point the question targets, or null if unknown. */
  outline_index: number | null;
};

export type FollowUpVerdict = "tepat" | "sebagian" | "keliru";

/**
 * Cleans the model's questions: trims, drops empties and duplicates, caps the
 * count and length, and keeps outline_index only when it points at a real
 * outline point.
 */
export function normalizeFollowUpQuestions(
  raw: readonly { question: string; outline_index?: number | null | undefined }[],
  outlineCount: number,
): FollowUpQuestion[] {
  const seen = new Set<string>();
  const out: FollowUpQuestion[] = [];
  for (const item of raw) {
    const question = item.question.trim().replace(/\s+/g, " ");
    if (!question || question.length > MAX_QUESTION_LENGTH) continue;
    const key = question.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const index =
      typeof item.outline_index === "number" ? Math.round(item.outline_index) : null;
    out.push({
      question,
      outline_index: index !== null && index >= 1 && index <= outlineCount ? index : null,
    });
    if (out.length >= MAX_FOLLOW_UPS) break;
  }
  return out;
}

/** Reads attempts.follow_up_questions (jsonb) back into typed questions. */
export function parseStoredFollowUps(value: Json | null): FollowUpQuestion[] {
  if (!Array.isArray(value)) return [];
  const out: FollowUpQuestion[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const { question, outline_index } = item;
    if (typeof question !== "string" || question.trim() === "") continue;
    out.push({
      question,
      outline_index: typeof outline_index === "number" ? outline_index : null,
    });
  }
  return out.slice(0, MAX_FOLLOW_UPS);
}

export const VERDICT_META: Record<
  FollowUpVerdict,
  { label: string; tone: "success" | "warning" | "error" }
> = {
  tepat: { label: "Tepat", tone: "success" },
  sebagian: { label: "Sebagian tepat", tone: "warning" },
  keliru: { label: "Masih keliru", tone: "error" },
};
