// ============================================================================
// API contracts — Zod schemas for every JSON endpoint, shared by the route
// handlers (which build responses typed against them) and the client
// (which validates what it receives via fetchJson). Client-safe: no server
// imports here.
// ============================================================================
import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------
export const ApiErrorSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  retryAfterSeconds: z.number().optional(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

export const OkResponseSchema = z.object({ ok: z.literal(true) });
export type OkResponse = z.infer<typeof OkResponseSchema>;

const HintLevelSchema = z.enum(["none", "keywords", "guiding_questions", "outline"]);
const SourceTypeSchema = z.enum(["video", "article", "book", "paper", "other"]);
const EvaluationStatusSchema = z.enum(["pending", "processing", "completed", "error"]);
const MasteryStateSchema = z.enum([
  "not_started",
  "attempted",
  "developing",
  "proficient",
  "mastered",
  "solidified",
]);

// ---------------------------------------------------------------------------
// POST /api/challenge/generate
// ---------------------------------------------------------------------------
export const GenerateRequestSchema = z.object({
  topic: z.string().trim().min(3).max(200),
});

export const PlanOutlineItemSchema = z.object({
  title: z.string(),
  description: z.string(),
  keywords: z.array(z.string()),
  guiding_question: z.string(),
});
export const PlanSourceSchema = z.object({
  title: z.string(),
  url: z.string().nullable(),
  type: SourceTypeSchema,
});
export const GenerateResponseSchema = z.object({
  outline: z.array(PlanOutlineItemSchema),
  sources: z.array(PlanSourceSchema),
  estimated_duration_sec: z.number(),
});
export type GenerateResponse = z.infer<typeof GenerateResponseSchema>;

// ---------------------------------------------------------------------------
// POST /api/challenge
// ---------------------------------------------------------------------------
export const CreateChallengeResponseSchema = z.object({ id: z.uuid() });
export type CreateChallengeResponse = z.infer<typeof CreateChallengeResponseSchema>;

// ---------------------------------------------------------------------------
// PATCH /api/challenge/[id]
// ---------------------------------------------------------------------------
export const ChallengePatchResponseSchema = z.object({
  challenge: z.object({ id: z.uuid(), title: z.string() }).loose(),
});
export type ChallengePatchResponse = z.infer<typeof ChallengePatchResponseSchema>;

// ---------------------------------------------------------------------------
// /api/challenge/[id]/outline
// ---------------------------------------------------------------------------
export const OutlineItemResponseSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  description: z.string().nullable(),
});
export const OutlineItemEnvelopeSchema = z.object({
  item: OutlineItemResponseSchema.loose(),
});
export type OutlineItemEnvelope = z.infer<typeof OutlineItemEnvelopeSchema>;

// ---------------------------------------------------------------------------
// /api/challenge/[id]/sources
// ---------------------------------------------------------------------------
export const SourceEnvelopeSchema = z.object({
  source: z
    .object({
      id: z.uuid(),
      title: z.string(),
      url: z.string().nullable(),
      source_type: SourceTypeSchema,
    })
    .loose(),
});
export type SourceEnvelope = z.infer<typeof SourceEnvelopeSchema>;

// ---------------------------------------------------------------------------
// PUT /api/challenge/[id]/notes
// ---------------------------------------------------------------------------
export const NoteEnvelopeSchema = z.object({
  note: z.object({ content: z.string(), updated_at: z.string() }).loose(),
});
export type NoteEnvelope = z.infer<typeof NoteEnvelopeSchema>;

// ---------------------------------------------------------------------------
// POST /api/challenge/[id]/attempt
// ---------------------------------------------------------------------------
export const AttemptCreateRequestSchema = z.object({
  storage_path: z.string().min(1).max(200),
  hint_level_used: HintLevelSchema,
  duration_seconds: z.number().int().nonnegative().max(36_000),
});
export type AttemptCreateRequest = z.infer<typeof AttemptCreateRequestSchema>;

export const AttemptCreateResponseSchema = z.object({ attemptId: z.uuid() });
export type AttemptCreateResponse = z.infer<typeof AttemptCreateResponseSchema>;

// ---------------------------------------------------------------------------
// GET /api/attempt/[attemptId]
// ---------------------------------------------------------------------------
export const AttemptStatusResponseSchema = z.object({
  evaluation_status: EvaluationStatusSchema,
  evaluation_error: z.string().nullable(),
});
export type AttemptStatusResponse = z.infer<typeof AttemptStatusResponseSchema>;

// ---------------------------------------------------------------------------
// POST /api/evaluate — 200 completed, or 202 processing (claim held elsewhere)
// ---------------------------------------------------------------------------
export const AudioIssueSchema = z.enum([
  "none",
  "silent",
  "too_short",
  "unintelligible",
  "off_topic",
]);

export const EvaluateResponseSchema = z.object({
  evaluation_status: z.enum(["completed", "processing"]),
  overall_score: z.number().nullable().optional(),
  mastery_state: MasteryStateSchema.optional(),
  /** Set when the audio could not be judged; the attempt then has no score. */
  audio_issue: AudioIssueSchema.optional(),
});
export type EvaluateResponse = z.infer<typeof EvaluateResponseSchema>;

// ---------------------------------------------------------------------------
// POST /api/challenge/[id]/hints
// ---------------------------------------------------------------------------
export const HintsResponseSchema = z.object({ updated: z.number().int().nonnegative() });
export type HintsResponse = z.infer<typeof HintsResponseSchema>;

/** Friendly explanation for attempts.audio_issue (unscored attempts). */
export const AUDIO_ISSUE_MESSAGES: Record<
  Exclude<z.infer<typeof AudioIssueSchema>, "none">,
  string
> = {
  silent: "Rekamannya terdengar hening. Pastikan mikrofon aktif dan tidak di-mute.",
  too_short: "Penjelasannya terlalu singkat untuk dinilai. Coba jelaskan lebih lengkap.",
  unintelligible:
    "Suaranya kurang jelas untuk ditranskrip. Coba rekam di tempat yang lebih tenang dan dekatkan mikrofon.",
  off_topic:
    "Penjelasanmu sepertinya belum membahas topik ini. Coba fokus pada poin-poin outline.",
};

/** User-facing explanation for attempts.evaluation_error codes. */
export const EVALUATION_ERROR_MESSAGES: Record<string, string> = {
  quota: "Kuota AI sedang habis. Tunggu beberapa menit lalu coba lagi.",
  timeout: "AI terlalu lama merespons. Coba lagi.",
  unavailable: "Layanan AI sedang sibuk. Coba lagi sebentar.",
  invalid_response: "Respons AI tidak dapat dibaca. Coba lagi.",
  storage: "Audio rekaman tidak bisa diambil dari penyimpanan.",
  unknown: "Evaluasi gagal karena kesalahan tak terduga. Coba lagi.",
};

export function describeEvaluationError(code: string | null | undefined): string {
  return (code && EVALUATION_ERROR_MESSAGES[code]) || EVALUATION_ERROR_MESSAGES.unknown!;
}
