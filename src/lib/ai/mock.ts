/**
 * AI_MOCK=1 (Prompt 4.3): every Gemini call returns a fixed answer instead of
 * reaching the network, so end-to-end tests run fast, free, and the same
 * every time. The fixtures go through the same Zod schemas as real answers.
 *
 * Refuses to run in production: a mocked evaluation there would hand real
 * learners fake scores.
 */

export type MockLabel = "outline" | "hints" | "evaluate" | "followup";

export function aiMockEnabled(env: { AI_MOCK?: string; VERCEL_ENV?: string }): boolean {
  if (env.AI_MOCK !== "1") return false;
  if (env.VERCEL_ENV === "production") {
    throw new Error("AI_MOCK=1 is not allowed in production.");
  }
  return true;
}

const TRANSCRIPT =
  "Intinya, ini tentang bagaimana sesuatu bekerja dari awal sampai akhir. " +
  "Cara kerjanya bertahap, setiap langkah memakai hasil langkah sebelumnya. " +
  "Saya belum yakin contohnya, mungkin seperti antrean di kasir.";

export const AI_MOCK_FIXTURES: Record<MockLabel, unknown> = {
  outline: {
    outline: [
      {
        title: "Gambaran besar",
        description: "Apa yang terjadi dari awal sampai akhir.",
        keywords: ["awal", "akhir", "tujuan"],
        guiding_question: "Kalau diringkas satu kalimat, apa yang sebenarnya terjadi?",
      },
      {
        title: "Cara kerjanya",
        description: "Langkah-langkah dan hubungan sebab akibatnya.",
        keywords: ["langkah", "sebab", "akibat"],
        guiding_question: "Langkah mana yang bergantung pada langkah sebelumnya?",
      },
      {
        title: "Contoh sehari-hari",
        description: "Satu contoh nyata yang menunjukkan konsepnya.",
        keywords: ["contoh", "sehari-hari"],
        guiding_question: "Di mana kamu pernah melihat ini terjadi?",
      },
    ],
    sources: [{ title: "Pengantar singkat", url: null, type: "article" }],
    estimated_duration_sec: 120,
  },
  hints: {
    items: Array.from({ length: 12 }, (_, index) => ({
      index: index + 1,
      keywords: ["konsep utama", "contoh"],
      guiding_question: "Bagaimana kamu menjelaskannya ke teman?",
    })),
  },
  evaluate: {
    transcript: TRANSCRIPT,
    audio_issue: "none",
    coverage: [
      {
        outline_index: 1,
        status: "covered",
        note: "Gambaran besarnya jelas.",
        evidence: "bagaimana sesuatu bekerja dari awal sampai akhir",
      },
      {
        outline_index: 2,
        status: "partial",
        note: "Langkahnya disebut, sebab akibatnya belum.",
        evidence: "setiap langkah memakai hasil langkah sebelumnya",
      },
      {
        outline_index: 3,
        status: "missing",
        note: "Belum ada contoh nyata.",
        evidence: "",
      },
    ],
    unexplained_jargon: [],
    sub_scores: { comprehensiveness: 6, accuracy: 8, clarity: 7 },
    feedback:
      "Gambaran besarnya sudah tertangkap. Berikutnya, hubungkan setiap langkah dengan alasannya.",
    strengths: ["Pembukaan yang langsung ke inti."],
    improvements: ["Tambahkan satu contoh nyata yang kamu kenal."],
    follow_up_questions: [
      { question: "Coba beri satu contoh dari kehidupanmu sendiri.", outline_index: 3 },
    ],
  },
  followup: {
    transcript: "Misalnya saat mengantre di kasir, yang datang duluan dilayani duluan.",
    audio_issue: "none",
    verdict: "sebagian",
    feedback: "Contohnya tepat, tapi hubungannya dengan konsep belum dijelaskan.",
    hint: "Sebutkan bagian mana dari contoh itu yang menunjukkan konsepnya.",
  },
};

function isMockLabel(label: string): label is MockLabel {
  return label in AI_MOCK_FIXTURES;
}

/** The fixed answer for one Gemini call, by its log label. */
export function mockAnswer(label: string): unknown {
  if (!isMockLabel(label)) {
    throw new Error(`AI_MOCK has no fixture for "${label}".`);
  }
  // A deep copy: callers must never be able to change the fixture.
  return structuredClone(AI_MOCK_FIXTURES[label]);
}
