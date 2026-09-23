import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types";

import { ANONYMOUS_AI_QUOTA, consumeAiQuota } from "./quota";
import { costUnitsFor } from "./usage";

type RpcRow = {
  allowed: boolean;
  retry_after_seconds: number;
  reason: string;
  usage_id?: string | null;
};

/** A Supabase client stub: only `rpc` is ever called by consumeAiQuota. */
function stub(result: { data?: RpcRow[] | null; error?: unknown }) {
  const rpc = vi.fn().mockResolvedValue({
    data: result.data ?? null,
    error: result.error ?? null,
  });
  return { client: { rpc } as unknown as SupabaseClient<Database>, rpc };
}

function refused(row: RpcRow, anonymous = false) {
  return consumeAiQuota(stub({ data: [row] }).client, "evaluate", { anonymous });
}

describe("consumeAiQuota", () => {
  it("allows the call when the database says so", async () => {
    const result = await refused({
      allowed: true,
      retry_after_seconds: 0,
      reason: "ok",
      usage_id: "c0ffee00-0000-4000-8000-000000000000",
    });
    expect(result).toEqual({
      allowed: true,
      usageId: "c0ffee00-0000-4000-8000-000000000000",
    });
  });

  it("tolerates a row without a usage id instead of crashing the request", async () => {
    const result = await refused({ allowed: true, retry_after_seconds: 0, reason: "ok" });
    expect(result).toEqual({ allowed: true, usageId: null });
  });

  it("sends the anonymous limits for anonymous users", async () => {
    const { client, rpc } = stub({
      data: [{ allowed: true, retry_after_seconds: 0, reason: "ok" }],
    });
    await consumeAiQuota(client, "evaluate", { anonymous: true });
    expect(rpc).toHaveBeenCalledWith("consume_ai_quota", {
      p_kind: "evaluate",
      p_per_day: ANONYMOUS_AI_QUOTA.evaluate.perDay,
      p_per_minute: ANONYMOUS_AI_QUOTA.evaluate.perMinute,
      p_cost_units: costUnitsFor("evaluate"),
    });
  });

  describe("per-user limits answer with 429", () => {
    it("tells a signed-in user when their quota comes back", async () => {
      const result = await refused({
        allowed: false,
        retry_after_seconds: 7200,
        reason: "day",
      });
      expect(result).toMatchObject({ allowed: false, reason: "day", status: 429 });
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.message).toContain("2 jam");
    });

    it("points a demo user at signing up", async () => {
      const result = await refused(
        { allowed: false, retry_after_seconds: 60, reason: "minute" },
        true,
      );
      if (result.allowed) throw new Error("expected a refusal");
      expect(result.status).toBe(429);
      expect(result.message).toContain("Buat akun gratis");
    });
  });

  describe("app-wide brakes answer with 503 and never blame the learner", () => {
    it("handles the kill switch", async () => {
      const result = await refused({
        allowed: false,
        retry_after_seconds: 0,
        reason: "disabled",
      });
      if (result.allowed) throw new Error("expected a refusal");
      expect(result.status).toBe(503);
      expect(result.message).not.toContain("Batas pemakaian");
      expect(result.message).toContain("aman");
    });

    it("handles the global daily ceiling", async () => {
      const result = await refused({
        allowed: false,
        retry_after_seconds: 3600,
        reason: "global",
      });
      if (result.allowed) throw new Error("expected a refusal");
      expect(result.status).toBe(503);
      expect(result.message).toContain("batas aman aplikasi");
    });
  });

  describe("fails closed", () => {
    it("refuses when the RPC errors, to protect the Gemini quota", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const { client } = stub({ error: new Error("boom") });
      const result = await consumeAiQuota(client, "generate");
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.status).toBe(503);
    });

    it("refuses when the RPC returns no row", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const { client } = stub({ data: [] });
      const result = await consumeAiQuota(client, "generate");
      expect(result.allowed).toBe(false);
    });
  });
});
