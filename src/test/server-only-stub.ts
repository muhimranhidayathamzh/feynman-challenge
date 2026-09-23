/**
 * Stand-in for the `server-only` package under Vitest.
 *
 * The real package throws on import outside a React Server Component, which is
 * exactly what we want in the Next.js build — but it also throws in a plain
 * Node test run. Aliased in vitest.config.ts so server-side modules can be unit
 * tested without weakening the guard in the app itself.
 */
export {};
