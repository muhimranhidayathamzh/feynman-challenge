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
// Zod schemas — validate the parsed JSON returned by Gemini.
// ----------------------------------------------------------------------------
export const OutlineItemSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().default(""),
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

// ----------------------------------------------------------------------------
// Gemini structured-output schema — guides the model toward valid JSON.
// Kept beside the Zod schema so the two representations don't drift.
// ----------------------------------------------------------------------------
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
        },
        required: ["title", "description"],
        propertyOrdering: ["title", "description"],
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
// Evaluation (audio multimodal) — §3
// ----------------------------------------------------------------------------
const COVERAGE_STATUSES = ["covered", "partial", "missing"] as const;

export const EvaluationResultSchema = z.object({
  transcript: z.string().default(""),
  // Scores may come back as floats; route rounds + clamps. Kept lenient here.
  overall_score: z.number(),
  sub_scores: z.object({
    comprehensiveness: z.number(),
    accuracy: z.number(),
    clarity: z.number(),
  }),
  coverage: z
    .array(
      z.object({
        topic: z.string(),
        status: z.enum(COVERAGE_STATUSES).catch("partial"),
        note: z.string().default(""),
      }),
    )
    .default([]),
  feedback: z.string().default(""),
  strengths: z.array(z.string()).default([]),
  improvements: z.array(z.string()).default([]),
});

export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;

export const EVALUATION_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    transcript: { type: Type.STRING },
    overall_score: { type: Type.INTEGER },
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
    coverage: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          topic: { type: Type.STRING },
          status: { type: Type.STRING, enum: [...COVERAGE_STATUSES] },
          note: { type: Type.STRING },
        },
        required: ["topic", "status", "note"],
        propertyOrdering: ["topic", "status", "note"],
      },
    },
    feedback: { type: Type.STRING },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
    improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: [
    "transcript",
    "overall_score",
    "sub_scores",
    "coverage",
    "feedback",
    "strengths",
    "improvements",
  ],
  propertyOrdering: [
    "transcript",
    "overall_score",
    "sub_scores",
    "coverage",
    "feedback",
    "strengths",
    "improvements",
  ],
};
