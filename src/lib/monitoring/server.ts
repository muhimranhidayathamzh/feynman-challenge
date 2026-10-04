import type { Instrumentation } from "next";
import { captureRequestError } from "@sentry/nextjs";

import { initMonitoring } from "./capture-server";

/** Node.js side of src/instrumentation.ts, loaded only when a DSN is set. */
export function initServerMonitoring(dsn: string): void {
  initMonitoring(dsn);
}

export function reportRequestError(
  ...args: Parameters<Instrumentation.onRequestError>
): void {
  captureRequestError(...args);
}
