/**
 * Guard for scheduled routes under /api/cron (Prompt 4.2). Vercel Cron sends
 * "Authorization: Bearer <CRON_SECRET>". Without a configured secret every
 * request is refused, so an unconfigured deployment exposes nothing.
 */
export function isCronAuthorized(
  authorization: string | null,
  secret: string | undefined,
): boolean {
  if (!secret || !authorization) return false;
  const expected = `Bearer ${secret}`;
  // Compare every character, so the time taken says nothing about how much
  // of a guess was right.
  let difference = authorization.length ^ expected.length;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= expected.charCodeAt(index) ^ (authorization.charCodeAt(index) || 0);
  }
  return difference === 0;
}
