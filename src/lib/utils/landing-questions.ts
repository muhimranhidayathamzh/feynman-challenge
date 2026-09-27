/**
 * The landing page's ten-second test (V.10). Everyday mechanisms most people
 * feel they understand until asked to explain them step by step: the
 * illusion of explanatory depth (Rozenblit and Keil, 2002). The zipper and
 * the lock come from that study.
 *
 * Deliberately not study topics: they must not make the product look like
 * it is for one school subject or one field.
 */
export const LANDING_QUESTIONS = [
  "Bagaimana resleting bekerja?",
  "Bagaimana gembok tahu kuncimu yang benar?",
  "Kenapa es mengapung di air?",
  "Bagaimana kulkas membuat isinya dingin?",
  "Kenapa langit berwarna biru?",
] as const;

export type LandingQuestion = (typeof LANDING_QUESTIONS)[number];

/**
 * One question for this visit. Takes the random number as an argument so the
 * choice is testable and the dev gallery can pin it for stable screenshots.
 * Anything outside [0, 1) falls back to the first question.
 */
export function pickQuestion(random: number): LandingQuestion {
  const valid = Number.isFinite(random) && random >= 0 && random < 1;
  const index = valid ? Math.floor(random * LANDING_QUESTIONS.length) : 0;
  return LANDING_QUESTIONS[index] ?? LANDING_QUESTIONS[0];
}

/** The same question, asked again at the end: "Jadi, bagaimana resleting bekerja?" */
export function closingQuestion(question: string): string {
  const trimmed = question.trim();
  if (!trimmed) return "";
  return `Jadi, ${trimmed.charAt(0).toLowerCase()}${trimmed.slice(1)}`;
}
