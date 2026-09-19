import { describe, expect, it } from "vitest";

import { buildDashboard, type DashboardRow } from "./dashboard";

const TODAY = "2026-09-19";

function row(overrides: Partial<DashboardRow> & { id: string }): DashboardRow {
  return {
    title: `Topik ${overrides.id}`,
    deadline: null,
    mastery_state: "developing",
    latest_score: 6,
    status: "active",
    review_box: 1,
    next_review_at: null,
    ...overrides,
  };
}

describe("buildDashboard", () => {
  it("reports an empty dashboard", () => {
    const data = buildDashboard([], TODAY, "active");
    expect(data.isEmpty).toBe(true);
    expect(data.tabCards).toEqual([]);
    expect(data.counts).toEqual({ active: 0, parked: 0, completed: 0 });
  });

  it("puts only the selected tab's challenges in the cards", () => {
    const data = buildDashboard(
      [row({ id: "a" }), row({ id: "b", status: "parked" })],
      TODAY,
      "parked",
    );
    expect(data.tabCards.map((card) => card.id)).toEqual(["b"]);
    expect(data.counts).toEqual({ active: 1, parked: 1, completed: 0 });
  });

  it("lists due deadlines of active challenges only, earliest first", () => {
    const data = buildDashboard(
      [
        row({ id: "later", deadline: "2026-09-21" }),
        row({ id: "today", deadline: TODAY }),
        row({ id: "parked", deadline: TODAY, status: "parked" }),
        row({ id: "far", deadline: "2026-12-01" }),
      ],
      TODAY,
      "active",
    );
    expect(data.dueSoon.map((item) => item.id)).toEqual(["today", "later"]);
  });

  it("lists due reviews (including completed), most overdue first, skipping parked", () => {
    const data = buildDashboard(
      [
        row({ id: "due", next_review_at: TODAY }),
        row({ id: "late", next_review_at: "2026-09-10", status: "completed" }),
        row({ id: "future", next_review_at: "2026-09-25" }),
        row({ id: "parked", next_review_at: "2026-09-01", status: "parked" }),
      ],
      TODAY,
      "active",
    );
    expect(data.reviews.map((item) => [item.id, item.daysOverdue])).toEqual([
      ["late", 9],
      ["due", 0],
    ]);
  });
});
