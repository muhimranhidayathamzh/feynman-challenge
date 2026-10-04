// Browser error monitoring (Prompt U.2). The condition is a build-time
// constant: without NEXT_PUBLIC_SENTRY_DSN the import below is dead code and
// the browser downloads nothing. With it, the SDK loads after the page,
// never in the first load.
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  void import("@/lib/monitoring/capture-client").then(({ initMonitoring }) =>
    initMonitoring(dsn),
  );
}

export {};
