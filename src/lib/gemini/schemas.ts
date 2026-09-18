import { Type, type Schema } from "@google/genai";
import { z } from "zod";

/** Recording-duration bounds the AI estimate is clamped to (1–10 minutes). */
export const MIN_DURATION_SEC = 60;
export const MAX_DURATION_SEC = 600;

const SOURCE_TYPES = ["video", "article", "book", "paper", "other"] as const;

/**
 * Returns the trimmed URL when it is a valid http(s) URL, otherwise null.
 * Used for both AI-suggested and user-added sources so we never store
 * javascript:, data:, or free-text "URLs".
 */
export function normalizeHttpUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  if (trimmed.length === 0) return null;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:" ? trimmed : null;
  } catch {
    return null;
  }
}

// ----------------------------------------------------------------------------
// Outline generation — Zod (validation) + Gemini structured-output schema.
// Kept side by side so the two representations don't drift.
// ----------------------------------------------------------------------------
export const OutlineItemSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().default(""),
  // Hint tier 1: concepts that must appear in the explanation (not the title).
  keywords: z.array(z.string()).default([]),
  // Hint tier 2: a question that prompts the explanation without answering it.
  guiding_question: z.string().trim().default(""),
});

export const GeneratedSourceSchema = z.object({
  title: z.string().trim().min(1),
  // AI-suggested URLs can be missing or approximate. Never reject the whole
  // response over a bad URL: keep it only if it is a real http(s) link.
  url: z.string().nullish().transform(normalizeHttpUrl),
  // Fall back to "other" rather than failing if the model returns an unknown type.
  type: z.enum(SOURCE_TYPES).catch("other"),
});

export const OutlineGenerationSchema = z.object({
  outline: z.array(OutlineItemSchema).min(1),
  sources: z.array(GeneratedSourceSchema).default([]),
  estimated_duration_sec: z.number().int().positive(),
});

export type OutlineItem = z.infer<typeof OutlineItemSchema>;
export type GeneratedSource = z.infer<typeof GeneratedSourceSchema>;
export type OutlineGeneration = z.infer<typeof OutlineGenerationSchema>;

const HINT_ITEM_PROPERTIES = {
  keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
  guiding_question: { type: Type.STRING },
} as const;

export const OUTLINE_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    outline: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          ...HINT_ITEM_PROPERTIES,
        },
        required: ["title", "description", "keywords", "guiding_question"],
        propertyOrdering: ["title", "description", "keywords", "guiding_question"],
      },
    },
    sources: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          url: { type: Type.STRING },
          type: { type: Type.STRING, enum: [...SOURCE_TYPES] },
        },
        required: ["title", "type"],
        propertyOrdering: ["title", "url", "type"],
      },
    },
    estimated_duration_sec: { type: Type.INTEGER },
  },
  required: ["outline", "sources", "estimated_duration_sec"],
  propertyOrdering: ["outline", "sources", "estimated_duration_sec"],
};

// ----------------------------------------------------------------------------
// Hint (re)generation for existing outline points.
// ----------------------------------------------------------------------------
export const HintsGenerationSchema = z.object({
  items: z
    .array(
      z.object({
        index: z.number().int(),
        keywords: z.array(z.string()).default([]),
        guiding_question: z.string().trim().default(""),
      }),
    )
    .default([]),
});
export type HintsGeneration = z.infer<typeof HintsGenerationSchema>;

export const HINTS_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { index: { type: Type.INTEGER }, ...HINT_ITEM_PROPERTIES },
        required: ["index", "keywords", "guiding_question"],
        propertyOrdering: ["index", "keywords", "guiding_question"],
      },
    },
  },
  required: ["items"],
};

// ----------------------------------------------------------------------------
// Evaluation (audio multimodal) — §3
// ----------------------------------------------------------------------------
const COVERAGE_STATUSES = ["covered", "partial", "missing"] as const;
export const AUDIO_ISSUES = [
  "none",
  "silent",
  "too_short",
  "unintelligible",
  "off_topic",
] as const;

export const EvaluationResultSchema = z.object({
  transcript: z.string().default(""),
  // Anything unexpected is treated as "none" (scored normally).
  audio_issue: z.enum(AUDIO_ISSUES).catch("none"),
  // One entry per outline point, keyed by its 1-based number. The server maps
  // numbers back to OUR titles (src/lib/utils/coverage.ts).
  coverage: z
    .array(
      z.object({
        outline_index: z.number(),
        status: z.enum(COVERAGE_STATUSES).catch("partial"),
        note: z.string().default(""),
        evidence: z.string().default(""),
      }),
    )
    .default([]),
  unexplained_jargon: z.array(z.string()).default([]),
  // No overall_score here on purpose: the server computes it from the
  // weighted sub-scores (src/lib/utils/scoring.ts) and applies the hint cap.
  sub_scores: z.object({
    comprehensiveness: z.number(),
    accuracy: z.number(),
    clarity: z.number(),
  }),
  feedback: z.string().default(""),
  strengths: z.array(z.string()).default([]),
  improvements: z.array(z.string()).default([]),
});

export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;

// Ordering matters: the model writes the transcript and per-point evidence
// before it commits to scores.
export const EVALUATION_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    transcript: { type: Type.STRING },
    audio_issue: { type: Type.STRING, enum: [...AUDIO_ISSUES] },
    coverage: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          outline_index: { type: Type.INTEGER },
          status: { type: Type.STRING, enum: [...COVERAGE_STATUSES] },
          note: { type: Type.STRING },
          evidence: { type: Type.STRING },
        },
        required: ["outline_index", "status", "note", "evidence"],
        propertyOrdering: ["outline_index", "status", "evidence", "note"],
      },
    },
    unexplained_jargon: { type: Type.ARRAY, items: { type: Type.STRING } },
    sub_scores: {
      type: Type.OBJECT,
      properties: {
        comprehensiveness: { type: Type.INTEGER },
        accuracy: { type: Type.INTEGER },
        clarity: { type: Type.INTEGER },
      },
      required: ["comprehensiveness", "accuracy", "clarity"],
      propertyOrdering: ["comprehensiveness", "accuracy", "clarity"],
    },
    feedback: { type: Type.STRING },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
    improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: [
    "transcript",
    "audio_issue",
    "coverage",
    "unexplained_jargon",
    "sub_scores",
    "feedback",
    "strengths",
    "improvements",
  ],
  propertyOrdering: [
    "transcript",
    "audio_issue",
    "coverage",
    "unexplained_jargon",
    "sub_scores",
    "feedback",
    "strengths",
    "improvements",
  ],
};
