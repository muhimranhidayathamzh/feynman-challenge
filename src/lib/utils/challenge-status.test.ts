import { describe, expect, it } from "vitest";

import {
  DASHBOARD_TABS,
  countByStatus,
  statusActions,
  tabFromSlug,
} from "./challenge-status";

describe("tabFromSlug", () => {
  it("maps Indonesian slugs to statuses", () => {
    expect(tabFromSlug("aktif").status).toBe("active");
    expect(tabFromSlug("istirahat").status).toBe("parked");
    expect(tabFromSlug("selesai").status).toBe("completed");
  });

  it("falls back to the active tab", () => {
    expect(tabFromSlug(undefined).status).toBe("active");
    expect(tabFromSlug("nope").status).toBe("active");
    expect(tabFromSlug(["selesai", "aktif"]).status).toBe("completed");
  });

  it("has one tab per status", () => {
    expect(DASHBOARD_TABS.map((tab) => tab.status)).toEqual([
      "active",
      "parked",
      "completed",
    ]);
  });
});

describe("countByStatus", () => {
  it("counts every status, including zeros", () => {
    expect(
      countByStatus([
        { status: "active" },
        { status: "active" },
        { status: "completed" },
      ]),
    ).toEqual({ active: 2, parked: 0, completed: 1 });
  });
});

describe("statusActions", () => {
  it("never offers the current status as a transition", () => {
    for (const status of ["active", "parked", "completed"] as const) {
      expect(statusActions(status).every((action) => action.nextStatus !== status)).toBe(
        true,
      );
    }
  });

  it("offers park + complete for active, reactivate for the others", () => {
    expect(statusActions("active").map((a) => a.nextStatus)).toEqual([
      "parked",
      "completed",
    ]);
    expect(statusActions("parked").map((a) => a.nextStatus)).toEqual([
      "active",
      "completed",
    ]);
    expect(statusActions("completed").map((a) => a.nextStatus)).toEqual(["active"]);
  });
});
