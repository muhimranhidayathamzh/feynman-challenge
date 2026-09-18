import { describe, expect, it } from "vitest";

import { normalizeFollowUpQuestions, parseStoredFollowUps } from "./followups";

describe("normalizeFollowUpQuestions", () => {
  it("keeps at most two cleaned, unique questions", () => {
    expect(
      normalizeFollowUpQuestions(
        [
          { question: "  Kenapa   langit biru? ", outline_index: 2 },
          { question: "kenapa langit biru?", outline_index: 1 },
          { question: "", outline_index: 1 },
          { question: "Apa itu hamburan Rayleigh?", outline_index: 3 },
          { question: "Pertanyaan ketiga", outline_index: 1 },
        ],
        3,
      ),
    ).toEqual([
      { question: "Kenapa langit biru?", outline_index: 2 },
      { question: "Apa itu hamburan Rayleigh?", outline_index: 3 },
    ]);
  });

  it("drops outline indices that don't exist", () => {
    expect(
      normalizeFollowUpQuestions(
        [
          { question: "A?", outline_index: 9 },
          { question: "B?", outline_index: 0 },
        ],
        3,
      ).map((q) => q.outline_index),
    ).toEqual([null, null]);
  });
});

describe("parseStoredFollowUps", () => {
  it("reads valid entries and ignores junk", () => {
    expect(
      parseStoredFollowUps([
        { question: "A?", outline_index: 1 },
        { question: "" },
        "junk",
        { question: "B?" },
      ]),
    ).toEqual([
      { question: "A?", outline_index: 1 },
      { question: "B?", outline_index: null },
    ]);
    expect(parseStoredFollowUps(null)).toEqual([]);
  });
});
