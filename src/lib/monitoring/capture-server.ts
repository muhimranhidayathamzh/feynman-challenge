// Server-side Sentry entry points (Prompt U.2). Named imports keep the
// bundle to what is used.
import { captureException, init } from "@sentry/nextjs";

import type { ErrorTags } from "./report";
import { sentryOptions } from "./sentry-options";

export function initMonitoring(dsn: string): void {
  init(sentryOptions(dsn));
}

export function capture(error: unknown, scope: string, tags: ErrorTags): void {
  captureException(error, { tags: { scope, ...tags } });
}
