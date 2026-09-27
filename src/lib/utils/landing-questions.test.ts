import { describe, expect, it } from "vitest";

import { LANDING_QUESTIONS, closingQuestion, pickQuestion } from "./landing-questions";

describe("pickQuestion", () => {
  it("covers every question across the range", () => {
    const seen = new Set(Array.from({ length: 100 }, (_, i) => pickQuestion(i / 100)));
    expect(seen).toEqual(new Set(LANDING_QUESTIONS));
  });

  it("maps the edges of [0, 1) to the first and last question", () => {
    expect(pickQuestion(0)).toBe(LANDING_QUESTIONS[0]);
    expect(pickQuestion(0.999999)).toBe(LANDING_QUESTIONS[LANDING_QUESTIONS.length - 1]);
  });

  it("falls back to the first question for anything outside [0, 1)", () => {
    for (const bad of [1, -0.1, 2, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(pickQuestion(bad), String(bad)).toBe(LANDING_QUESTIONS[0]);
    }
  });
});

describe("closingQuestion", () => {
  it("asks the same question again, lower-cased after 'Jadi,'", () => {
    expect(closingQuestion("Bagaimana resleting bekerja?")).toBe(
      "Jadi, bagaimana resleting bekerja?",
    );
  });

  it("works for every question on the landing", () => {
    for (const question of LANDING_QUESTIONS) {
      const closing = closingQuestion(question);
      expect(closing.startsWith("Jadi, ")).toBe(true);
      expect(closing.endsWith("?")).toBe(true);
    }
  });

  it("returns nothing for a blank question", () => {
    expect(closingQuestion("   ")).toBe("");
  });
});

describe("the questions themselves", () => {
  it("are unique questions that end with a question mark", () => {
    expect(new Set(LANDING_QUESTIONS).size).toBe(LANDING_QUESTIONS.length);
    for (const question of LANDING_QUESTIONS) expect(question.endsWith("?")).toBe(true);
  });
});
