// Browser-side Sentry entry points (Prompt U.2). The plain browser SDK, not
// @sentry/nextjs: the Next.js client entry always brings its tracing
// integration along, several times the size, for data we never collect.
import { captureException, init } from "@sentry/browser";

import type { ErrorTags } from "./report";
import { sentryOptions } from "./sentry-options";

export function initMonitoring(dsn: string): void {
  init(sentryOptions(dsn));
}

export function capture(error: unknown, scope: string, tags: ErrorTags): void {
  captureException(error, { tags: { scope, ...tags } });
}
