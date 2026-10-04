import { describe, expect, it } from "vitest";

import {
  findIdleAnonymousAccounts,
  findOrphanRecordings,
  formatBytes,
  isDeleteConfirmed,
  lastActivity,
  totalBytes,
  usesPassword,
  type StoredObject,
} from "./account-cleanup";

const NOW = new Date("2026-10-04T12:00:00Z");

describe("isDeleteConfirmed", () => {
  it("accepts exactly HAPUS, ignoring surrounding spaces", () => {
    expect(isDeleteConfirmed("HAPUS")).toBe(true);
    expect(isDeleteConfirmed("  HAPUS ")).toBe(true);
  });

  it("rejects anything else, including lower case", () => {
    expect(isDeleteConfirmed("hapus")).toBe(false);
    expect(isDeleteConfirmed("HAPUS AKUN")).toBe(false);
    expect(isDeleteConfirmed("")).toBe(false);
  });
});

describe("findOrphanRecordings", () => {
  const object = (path: string, createdAt: string | null, bytes = 100): StoredObject => ({
    path,
    createdAt,
    bytes,
  });

  it("keeps referenced recordings and fresh uploads, returns the rest", () => {
    const objects = [
      object("u/c/referenced.webm", "2026-09-01T00:00:00Z"),
      object("u/c/old.webm", "2026-10-02T12:00:00Z"),
      object("u/c/fresh.webm", "2026-10-04T01:00:00Z"),
    ];
    const orphans = findOrphanRecordings(objects, new Set(["u/c/referenced.webm"]), NOW);
    expect(orphans.map((o) => o.path)).toEqual(["u/c/old.webm"]);
  });

  it("treats exactly 24 hours as still too young", () => {
    const objects = [object("u/c/a.webm", "2026-10-03T12:00:00Z")];
    expect(findOrphanRecordings(objects, new Set(), NOW)).toEqual([]);
  });

  it("never deletes a file whose age is unknown", () => {
    const objects = [object("u/c/a.webm", null), object("u/c/b.webm", "garbage")];
    expect(findOrphanRecordings(objects, new Set(), NOW)).toEqual([]);
  });
});

describe("lastActivity", () => {
  it("picks the newest readable timestamp", () => {
    expect(
      lastActivity([null, "2026-09-01T00:00:00Z", "nope", "2026-09-20T00:00:00Z"]),
    ).toEqual(new Date("2026-09-20T00:00:00Z"));
  });

  it("is null when nothing can be read", () => {
    expect(lastActivity([null, undefined, ""])).toBeNull();
  });
});

describe("findIdleAnonymousAccounts", () => {
  it("chooses only anonymous accounts idle for more than seven days", () => {
    const ids = findIdleAnonymousAccounts(
      [
        { id: "idle", isAnonymous: true, activity: ["2026-09-20T00:00:00Z"] },
        {
          id: "came-back",
          isAnonymous: true,
          activity: ["2026-09-01T00:00:00Z", "2026-10-01T00:00:00Z"],
        },
        { id: "email", isAnonymous: false, activity: ["2026-01-01T00:00:00Z"] },
        { id: "unknown", isAnonymous: true, activity: [null] },
      ],
      NOW,
    );
    expect(ids).toEqual(["idle"]);
  });
});

describe("bytes", () => {
  it("adds up and formats sizes", () => {
    expect(
      totalBytes([
        { path: "a", createdAt: null, bytes: 1024 },
        { path: "b", createdAt: null, bytes: 512 },
      ]),
    ).toBe(1536);
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(12.3 * 1024 * 1024)).toBe("12.3 MB");
  });
});

describe("usesPassword", () => {
  it("asks email accounts for their password, not Google or demo ones", () => {
    expect(usesPassword({ app_metadata: { providers: ["email"] } })).toBe(true);
    expect(usesPassword({ app_metadata: { providers: ["email", "google"] } })).toBe(true);
    expect(usesPassword({ app_metadata: { providers: ["google"] } })).toBe(false);
    expect(usesPassword({ is_anonymous: true, app_metadata: {} })).toBe(false);
  });

  it("asks when the providers are unknown", () => {
    expect(usesPassword({ app_metadata: {} })).toBe(true);
  });
});
