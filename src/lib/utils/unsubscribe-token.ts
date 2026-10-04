/**
 * Unsubscribe links that work without signing in (Prompt 5.4): the user id
 * plus an HMAC of it. Anyone holding the link can switch that one person's
 * reminders off, which is exactly what the link is for, and nothing more.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

/** Keyed from the cron secret, separated by purpose. */
function signature(userId: string, secret: string): string {
  return createHmac("sha256", `unsubscribe:${secret}`).update(userId).digest("base64url");
}

export function unsubscribeToken(userId: string, secret: string): string {
  return signature(userId, secret);
}

export function verifyUnsubscribeToken(
  userId: string,
  token: string,
  secret: string,
): boolean {
  const expected = Buffer.from(signature(userId, secret));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** /berhenti?u=<user>&t=<token> on the given origin. */
export function unsubscribeUrl(origin: string, userId: string, secret: string): string {
  const params = new URLSearchParams({ u: userId, t: unsubscribeToken(userId, secret) });
  return `${origin}/berhenti?${params.toString()}`;
}

/**
 * The same opt-out as an endpoint, for mail apps' own "unsubscribe" button
 * (List-Unsubscribe with One-Click, RFC 8058).
 */
export function oneClickUnsubscribeUrl(
  origin: string,
  userId: string,
  secret: string,
): string {
  const params = new URLSearchParams({ u: userId, t: unsubscribeToken(userId, secret) });
  return `${origin}/api/reminders/unsubscribe?${params.toString()}`;
}
