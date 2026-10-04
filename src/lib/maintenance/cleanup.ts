// ============================================================================
// Storage and account housekeeping (Prompt 4.2). Needs a service-role client,
// so it runs only in the account-deletion route, the cron route, and
// scripts/maintenance.ts. No "server-only" import here: the script runs
// outside Next.js. The decisions themselves are in utils/account-cleanup.ts.
// ============================================================================
import type { SupabaseClient } from "@supabase/supabase-js";

import { RECORDINGS_BUCKET } from "@/lib/storage/recording-path";
import {
  findIdleAnonymousAccounts,
  findOrphanRecordings,
  totalBytes,
  type AccountActivity,
  type StoredObject,
} from "@/lib/utils/account-cleanup";
import type { Database } from "@/types";

export type AdminClient = SupabaseClient<Database>;

const LIST_PAGE = 100;
const REMOVE_BATCH = 100;
const ROW_PAGE = 1000;

/** Every object under `prefix` ("" for the whole bucket), at any depth. */
export async function listObjects(
  admin: AdminClient,
  prefix: string,
): Promise<StoredObject[]> {
  const storage = admin.storage.from(RECORDINGS_BUCKET);
  const found: StoredObject[] = [];
  const folders = [prefix];
  while (folders.length > 0) {
    const folder = folders.pop() ?? "";
    for (let offset = 0; ; offset += LIST_PAGE) {
      const { data, error } = await storage.list(folder, {
        limit: LIST_PAGE,
        offset,
      });
      if (error) throw error;
      const entries = data ?? [];
      for (const entry of entries) {
        const path = folder ? `${folder}/${entry.name}` : entry.name;
        if (entry.id === null) {
          // Folders have no id.
          folders.push(path);
          continue;
        }
        const size = (entry.metadata as { size?: unknown } | null)?.size;
        found.push({
          path,
          createdAt: entry.created_at ?? null,
          bytes: typeof size === "number" ? size : 0,
        });
      }
      if (entries.length < LIST_PAGE) break;
    }
  }
  return found;
}

/** Removes the given objects. Throws on the first failure. */
export async function removeObjects(
  admin: AdminClient,
  paths: readonly string[],
): Promise<void> {
  const storage = admin.storage.from(RECORDINGS_BUCKET);
  for (let start = 0; start < paths.length; start += REMOVE_BATCH) {
    const { error } = await storage.remove(paths.slice(start, start + REMOVE_BATCH));
    if (error) throw error;
  }
}

/**
 * Deletes a user: every recording under {userId}/ first, then the auth user
 * (the tables follow by cascade). If the files cannot be removed, the account
 * stays, so nothing is left behind that the learner can no longer reach.
 */
export async function deleteAccount(admin: AdminClient, userId: string): Promise<void> {
  const objects = await listObjects(admin, userId);
  await removeObjects(
    admin,
    objects.map((object) => object.path),
  );
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw error;
}

async function referencedRecordings(admin: AdminClient): Promise<Set<string>> {
  const referenced = new Set<string>();
  for (const table of ["attempts", "attempt_followups"] as const) {
    for (let from = 0; ; from += ROW_PAGE) {
      const { data, error } = await admin
        .from(table)
        .select("audio_storage_path")
        .not("audio_storage_path", "is", null)
        .range(from, from + ROW_PAGE - 1);
      if (error) throw error;
      for (const row of data ?? []) {
        if (row.audio_storage_path) referenced.add(row.audio_storage_path);
      }
      if ((data ?? []).length < ROW_PAGE) break;
    }
  }
  return referenced;
}

async function anonymousActivity(admin: AdminClient): Promise<AccountActivity[]> {
  const accounts: AccountActivity[] = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: ROW_PAGE });
    if (error) throw error;
    for (const user of data.users) {
      if (!user.is_anonymous) continue;
      accounts.push({
        id: user.id,
        isAnonymous: true,
        activity: [user.created_at, user.last_sign_in_at],
      });
    }
    if (data.users.length < ROW_PAGE) break;
  }
  if (accounts.length === 0) return accounts;

  // A demo session can stay signed in for weeks without a new sign-in, so
  // the learner's own work counts as activity too.
  const ids = accounts.map((account) => account.id);
  const extra = new Map<string, string[]>();
  const add = (userId: string, ...times: (string | null)[]) => {
    const list = extra.get(userId) ?? [];
    for (const time of times) if (time) list.push(time);
    extra.set(userId, list);
  };
  for (let start = 0; start < ids.length; start += ROW_PAGE) {
    const chunk = ids.slice(start, start + ROW_PAGE);
    const [challenges, usage] = await Promise.all([
      admin
        .from("challenges")
        .select("user_id, updated_at, last_attempt_at")
        .in("user_id", chunk),
      admin.from("ai_usage").select("user_id, created_at").in("user_id", chunk),
    ]);
    if (challenges.error) throw challenges.error;
    if (usage.error) throw usage.error;
    for (const row of challenges.data ?? []) {
      add(row.user_id, row.updated_at, row.last_attempt_at);
    }
    for (const row of usage.data ?? []) add(row.user_id, row.created_at);
  }
  return accounts.map((account) => ({
    ...account,
    activity: [...account.activity, ...(extra.get(account.id) ?? [])],
  }));
}

export interface MaintenanceReport {
  applied: boolean;
  orphans: { count: number; bytes: number };
  idleAccounts: { count: number; bytes: number };
}

/**
 * Finds orphaned recordings and idle anonymous accounts. With `apply`, removes
 * them; otherwise only counts (dry run).
 */
export async function runMaintenance(
  admin: AdminClient,
  options: { apply: boolean; now?: Date },
): Promise<MaintenanceReport> {
  const now = options.now ?? new Date();
  const [objects, referenced, accounts] = await Promise.all([
    listObjects(admin, ""),
    referencedRecordings(admin),
    anonymousActivity(admin),
  ]);

  const idle = new Set(findIdleAnonymousAccounts(accounts, now));
  const ownerOf = (path: string) => path.slice(0, path.indexOf("/"));
  const idleObjects = objects.filter((object) => idle.has(ownerOf(object.path)));
  // An idle account's files go with the account; do not count them twice.
  const orphans = findOrphanRecordings(
    objects.filter((object) => !idle.has(ownerOf(object.path))),
    referenced,
    now,
  );

  if (options.apply) {
    await removeObjects(
      admin,
      orphans.map((object) => object.path),
    );
    for (const userId of idle) await deleteAccount(admin, userId);
  }

  return {
    applied: options.apply,
    orphans: { count: orphans.length, bytes: totalBytes(orphans) },
    idleAccounts: { count: idle.size, bytes: totalBytes(idleObjects) },
  };
}
