import type { Instrumentation } from "next";

// Server error monitoring (Prompt U.2). Both conditions are written as
// literal `process.env.X` checks on purpose: Next.js replaces them at build
// time, so the Edge build (the middleware) and any build without a DSN drop
// the Sentry import entirely. A helper function would hide them from that.

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NEXT_PUBLIC_SENTRY_DSN) {
    const { initServerMonitoring } = await import("@/lib/monitoring/server");
    initServerMonitoring(process.env.NEXT_PUBLIC_SENTRY_DSN);
  }
}

/** Errors Next.js catches itself (render, route, and action errors). */
export const onRequestError: Instrumentation.onRequestError = async (...args) => {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NEXT_PUBLIC_SENTRY_DSN) {
    const { reportRequestError } = await import("@/lib/monitoring/server");
    reportRequestError(...args);
  }
};
