/**
 * Account deletion and storage housekeeping (Prompt 4.2): the decisions,
 * kept pure so they can be tested. The I/O lives in src/lib/maintenance.
 */

/** What the learner types to confirm deleting their account (D10). */
export const DELETE_CONFIRMATION = "HAPUS";

export function isDeleteConfirmed(text: string): boolean {
  return text.trim() === DELETE_CONFIRMATION;
}

/** A recording younger than this may belong to an upload still in flight. */
export const ORPHAN_MIN_AGE_HOURS = 24;

/** Anonymous demo accounts idle this long are removed with their files. */
export const ANONYMOUS_IDLE_DAYS = 7;

export interface StoredObject {
  path: string;
  /** ISO timestamp, or null when Storage did not report one. */
  createdAt: string | null;
  bytes: number;
}

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/**
 * Recordings no attempt or follow-up answer points at, and old enough that
 * no upload can still be on its way to being referenced. An object with no
 * known age is kept: deleting is the one mistake that cannot be undone.
 */
export function findOrphanRecordings(
  objects: readonly StoredObject[],
  referenced: ReadonlySet<string>,
  now: Date,
  minAgeHours: number = ORPHAN_MIN_AGE_HOURS,
): StoredObject[] {
  const cutoff = now.getTime() - minAgeHours * HOUR_MS;
  return objects.filter((object) => {
    if (referenced.has(object.path)) return false;
    const created = object.createdAt ? Date.parse(object.createdAt) : Number.NaN;
    return Number.isFinite(created) && created < cutoff;
  });
}

/** The latest of several timestamps; null when none can be read. */
export function lastActivity(
  timestamps: readonly (string | null | undefined)[],
): Date | null {
  let latest: number | null = null;
  for (const value of timestamps) {
    if (!value) continue;
    const time = Date.parse(value);
    if (Number.isFinite(time) && (latest === null || time > latest)) latest = time;
  }
  return latest === null ? null : new Date(latest);
}

export interface AccountActivity {
  id: string;
  isAnonymous: boolean;
  /** Sign-in, creation, and the newest challenge or attempt, in any order. */
  activity: readonly (string | null | undefined)[];
}

/**
 * Anonymous accounts with no activity for `idleDays`. Accounts with an
 * email are never chosen, and neither is one whose activity is unknown.
 */
export function findIdleAnonymousAccounts(
  accounts: readonly AccountActivity[],
  now: Date,
  idleDays: number = ANONYMOUS_IDLE_DAYS,
): string[] {
  const cutoff = now.getTime() - idleDays * DAY_MS;
  return accounts
    .filter((account) => {
      if (!account.isAnonymous) return false;
      const latest = lastActivity(account.activity);
      return latest !== null && latest.getTime() < cutoff;
    })
    .map((account) => account.id);
}

export function totalBytes(objects: readonly StoredObject[]): number {
  return objects.reduce((sum, object) => sum + object.bytes, 0);
}

/** "0 B", "512 B", "1.5 KB", "12.3 MB". */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(1)} ${units[unit]}`;
}

/**
 * Whether the account signs in with email and password, so deleting it asks
 * for the password too (D10). Google-only and anonymous accounts have none.
 * Missing provider data counts as email: asking once too often is safer
 * than deleting without asking.
 */
export function usesPassword(user: {
  is_anonymous?: boolean;
  app_metadata: { providers?: unknown };
}): boolean {
  if (user.is_anonymous) return false;
  const providers = user.app_metadata.providers;
  return !Array.isArray(providers) || providers.includes("email");
}
