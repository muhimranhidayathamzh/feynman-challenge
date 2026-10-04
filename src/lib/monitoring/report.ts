/** What broke, without who or what they said (Prompt U.2). */
export interface ErrorTags {
  /** generate | hints | evaluate | followup */
  ai_kind?: string;
  /** GeminiErrorCode, or "storage" for a failed audio download. */
  gemini_code?: string;
  /** latencyBucket() of the AI call or the whole evaluation. */
  latency?: string;
}

/**
 * Logs an error and, when monitoring is on, reports it with tags. Usable on
 * the server and in the browser.
 *
 * Both checks are literal process.env reads that Next.js replaces at build
 * time: a build without a DSN drops the Sentry import, and each side keeps
 * only its own SDK (NEXT_RUNTIME is empty in the browser).
 */
export function logError(scope: string, error: unknown, tags: ErrorTags = {}): void {
  console.error(scope, error);
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  const label = scope.replace(/[:\s]+$/, "");
  const loading = process.env.NEXT_RUNTIME
    ? import("./capture-server")
    : import("./capture-client");
  void loading.then(({ capture }) => capture(error, label, tags)).catch(() => undefined);
}
