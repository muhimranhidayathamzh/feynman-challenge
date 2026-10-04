// ============================================================================
// Sentry options shared by the server and the browser (Prompt U.2). Loaded
// only through dynamic import once a DSN is set, so a deployment without one
// ships none of this.
//
// Sentry's defaults collect a lot: request bodies, cookies, headers, local
// variable values in stack frames, database query data, and the inputs and
// outputs of AI calls. Any of those could carry a transcript or a note, so
// every one is switched off here, and scrubEvent() filters what remains.
// ============================================================================
import type { BrowserOptions } from "@sentry/browser";
import type { NodeOptions } from "@sentry/nextjs";

import { scrubBreadcrumb, scrubEvent } from "@/lib/utils/error-scrub";

/** Integrations that would read AI payloads or local variables. */
const DROPPED_INTEGRATIONS = /gen.?ai|localvariables/i;

export function sentryOptions(dsn: string): BrowserOptions & NodeOptions {
  return {
    dsn,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
    // Errors only. tracesSampleRate stays unset on purpose: even 0 counts as
    // "tracing on" and pulls in the tracing integration. No session replay.
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      genAI: { inputs: false, outputs: false },
      databaseQueryData: false,
      queues: false,
      stackFrameVariables: false,
    },
    integrations: (defaults) =>
      defaults.filter((integration) => !DROPPED_INTEGRATIONS.test(integration.name)),
    beforeSend: (event) => scrubEvent(event),
    beforeBreadcrumb: (breadcrumb) => scrubBreadcrumb(breadcrumb),
  };
}
