// ============================================================================
// Gemini error classification + retry policy — pure, unit-tested.
// The network-facing wrapper lives in ./generate.ts.
// ============================================================================

export type GeminiErrorCode =
  | "timeout" // our abort signal fired
  | "quota" // 429 from the API
  | "unavailable" // 5xx or network failure
  | "invalid_response" // empty / unparsable / schema-invalid output
  | "unknown";

export class GeminiError extends Error {
  readonly code: GeminiErrorCode;
  readonly status: number | null;

  constructor(code: GeminiErrorCode, message: string, status: number | null = null) {
    super(message);
    this.name = "GeminiError";
    this.code = code;
    this.status = status;
  }
}

/** User-facing (Bahasa Indonesia) message + HTTP status per error code. */
export const GEMINI_ERROR_RESPONSE: Record<
  GeminiErrorCode,
  { status: number; message: string }
> = {
  timeout: { status: 504, message: "AI terlalu lama merespons. Coba lagi." },
  quota: { status: 429, message: "Kuota AI sedang habis, coba beberapa menit lagi." },
  unavailable: { status: 503, message: "Layanan AI sedang sibuk. Coba lagi sebentar." },
  invalid_response: {
    status: 502,
    message: "Respons AI tidak dapat dibaca. Coba lagi.",
  },
  unknown: { status: 500, message: "Terjadi kesalahan pada AI. Coba lagi." },
};

function readStatus(error: unknown): number | null {
  if (typeof error === "object" && error !== null && "status" in error) {
    const status = (error as { status: unknown }).status;
    return typeof status === "number" ? status : null;
  }
  return null;
}

/**
 * Maps whatever the SDK / fetch threw to one of our codes.
 * - Abort (our timeout)            -> timeout
 * - ApiError 429                   -> quota
 * - ApiError 5xx, TypeError (fetch) -> unavailable
 * - anything else                  -> unknown
 */
export function classifyGeminiError(error: unknown): GeminiError {
  if (error instanceof GeminiError) return error;

  const name = error instanceof Error ? error.name : "";
  const message = error instanceof Error ? error.message : String(error);

  if (name === "AbortError" || /aborted/i.test(message)) {
    return new GeminiError("timeout", message);
  }

  const status = readStatus(error);
  if (status === 429) return new GeminiError("quota", message, status);
  if (status !== null && status >= 500)
    return new GeminiError("unavailable", message, status);
  if (status !== null) return new GeminiError("unknown", message, status);

  // undici/fetch network failures surface as TypeError("fetch failed").
  if (error instanceof TypeError) return new GeminiError("unavailable", message);

  return new GeminiError("unknown", message);
}

/** Only transient failures are worth another try. */
export function isRetryable(code: GeminiErrorCode): boolean {
  return code === "quota" || code === "unavailable";
}

/**
 * Exponential backoff with full jitter: base * 2^attempt, scaled by a random
 * factor in [0.5, 1]. `random` is injectable for tests.
 */
export function backoffDelayMs(
  attempt: number,
  baseMs = 1000,
  random: () => number = Math.random,
): number {
  const exponential = baseMs * 2 ** attempt;
  return Math.round(exponential * (0.5 + random() * 0.5));
}

/**
 * Decides whether another try fits in the remaining time budget.
 * We need the backoff delay plus a realistic minimum for the call itself.
 */
export function canRetryWithinBudget(
  delayMs: number,
  remainingBudgetMs: number,
  minCallMs: number,
): boolean {
  return delayMs + minCallMs <= remainingBudgetMs;
}
