/**
 * Last line of defence before an error report leaves the app (Prompt U.2).
 * Sentry is configured to collect nothing personal; this filter still
 * removes anything that slips through: request bodies, cookies, headers,
 * query strings, the user, console breadcrumbs, and any field whose name
 * suggests learner content. Emails in messages are masked.
 */
import type { Breadcrumb, Event } from "@sentry/nextjs";

const SENSITIVE_KEY =
  /transcript|audio|record|note|catatan|email|password|token|secret|body|feedback|prompt|content|cookie|authori[sz]ation|answer|jawaban/i;

const EMAIL = /[\w.+-]+@[\w-]+(\.[\w-]+)+/g;

export function redactText(text: string): string {
  return text.replace(EMAIL, "[email]");
}

function stripQuery(url: string): string {
  const cut = url.search(/[?#]/);
  return cut === -1 ? url : url.slice(0, cut);
}

function scrubRecord(record: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (SENSITIVE_KEY.test(key)) continue;
    if (typeof value === "string") clean[key] = redactText(value);
    else if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      clean[key] = scrubRecord(value as Record<string, unknown>);
    } else clean[key] = value;
  }
  return clean;
}

export function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb | null {
  // Console output can echo anything, learner content included.
  if (breadcrumb.category === "console") return null;
  const data = breadcrumb.data;
  const kept: Record<string, unknown> = {};
  if (data) {
    if (typeof data.url === "string") kept.url = stripQuery(data.url);
    if (typeof data.method === "string") kept.method = data.method;
    if (typeof data.status_code === "number") kept.status_code = data.status_code;
  }
  return {
    ...breadcrumb,
    ...(breadcrumb.message !== undefined && { message: redactText(breadcrumb.message) }),
    data: kept,
  };
}

export function scrubEvent<T extends Event>(event: T): T {
  const clean: T = { ...event };
  delete clean.user;

  if (clean.request) {
    clean.request = {
      ...(clean.request.method !== undefined && { method: clean.request.method }),
      ...(clean.request.url !== undefined && { url: stripQuery(clean.request.url) }),
    };
  }
  if (clean.message !== undefined) clean.message = redactText(clean.message);
  if (clean.exception?.values) {
    clean.exception = {
      ...clean.exception,
      values: clean.exception.values.map((value) => ({
        ...value,
        ...(value.value !== undefined && { value: redactText(value.value) }),
      })),
    };
  }
  if (clean.breadcrumbs) {
    clean.breadcrumbs = clean.breadcrumbs
      .map(scrubBreadcrumb)
      .filter((crumb): crumb is Breadcrumb => crumb !== null);
  }
  if (clean.extra) clean.extra = scrubRecord(clean.extra);
  if (clean.contexts) {
    clean.contexts = scrubRecord(clean.contexts) as NonNullable<T["contexts"]>;
  }
  return clean;
}

/** Evaluation time as a coarse tag: precise numbers would make every event unique. */
export function latencyBucket(ms: number): string {
  if (ms < 10_000) return "<10s";
  if (ms < 30_000) return "10-30s";
  if (ms < 55_000) return "30-55s";
  return ">=55s";
}
