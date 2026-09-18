import { MAX_DURATION_SEC, MIN_DURATION_SEC } from "@/lib/gemini/schemas";
import type { HintLevel } from "@/types";

/**
 * System role for outline generation. Keeps the model focused on producing a
 * concise, rubric-shaped learning plan and JSON-only output.
 */
export const OUTLINE_SYSTEM_INSTRUCTION = `Kamu adalah perancang kurikulum ahli untuk aplikasi "Feynman Challenge".
Tugasmu: dari satu topik, susun rencana belajar ringkas agar pengguna bisa menjelaskan ulang topik itu dengan kata-katanya sendiri (Feynman Technique).
Selalu balas HANYA dengan JSON valid sesuai skema yang diminta — tanpa teks pembuka, tanpa penutup, tanpa markdown.`;

/**
 * Builds the user prompt for generating an outline + sources + duration estimate
 * for a given topic.
 */
export function buildOutlinePrompt(topic: string): string {
  return `Topik yang ingin dipelajari pengguna: "${topic}"

Hasilkan objek JSON dengan field berikut:

1. "outline": 4–6 poin pembelajaran inti, terurut dari paling fundamental ke paling lanjutan. Poin-poin ini akan dipakai sebagai rubrik penilaian saat pengguna menjelaskan ulang. Setiap poin punya:
   - "title": frasa singkat dan jelas.
   - "description": satu kalimat yang menjelaskan apa yang harus dikuasai pada poin itu.

2. "sources": 2–4 sumber belajar berkualitas dan relevan. Setiap sumber punya:
   - "title": judul sumber.
   - "type": salah satu dari "video", "article", "book", "paper", atau "other".
   - "url": sertakan HANYA jika kamu yakin URL-nya benar dan masih aktif. Jika ragu, kosongkan (null) — JANGAN mengarang URL.

3. "estimated_duration_sec": estimasi durasi rekaman penjelasan dalam detik, berdasarkan kompleksitas topik. Harus berupa bilangan bulat antara ${MIN_DURATION_SEC} dan ${MAX_DURATION_SEC}.

Tulis seluruh teks dalam Bahasa Indonesia; istilah teknis boleh tetap dalam Bahasa Inggris.`;
}

// ---------------------------------------------------------------------------
// Evaluation (audio multimodal) — master spec §3
// ---------------------------------------------------------------------------

/** System role for evaluating a recorded explanation. */
export const EVALUATION_SYSTEM_INSTRUCTION = `Kamu adalah evaluator ahli untuk "Feynman Learning Challenge".
Kamu menerima rekaman audio seorang pelajar yang menjelaskan ulang sebuah topik dengan kata-katanya sendiri.
Tugasmu: (1) transkrip audio se-akurat mungkin, (2) evaluasi penjelasan berdasarkan learning outline sebagai acuan kebenaran, (3) beri skor dan feedback yang membangun.
Bersikap adil tapi jujur. Tangani campuran Bahasa Indonesia dan Inggris secara alami.
Selalu balas HANYA dengan JSON valid sesuai skema — tanpa teks pembuka/penutup, tanpa markdown.`;

const HINT_LABEL: Record<HintLevel, string> = {
  none: "Tanpa hint",
  keywords: "Kata kunci",
  guiding_questions: "Pertanyaan pemandu",
  outline: "Outline lengkap",
};

/**
 * Builds the evaluation prompt. The audio is attached separately as an inline
 * data part by the caller; this text carries the rubric + ground-truth outline.
 */
export function buildEvaluationPrompt(params: {
  outline: { title: string; description: string | null }[];
  notes: string | null;
  hintLevel: HintLevel;
  maxScore: number;
}): string {
  const { outline, notes, hintLevel, maxScore } = params;

  const outlineText = outline
    .map((item, index) => {
      const desc = item.description ? ` — ${item.description}` : "";
      return `${index + 1}. ${item.title}${desc}`;
    })
    .join("\n");

  const notesText = notes && notes.trim().length > 0 ? notes.trim() : "(tidak ada)";

  return `TUGAS:
1. Transkrip audio yang diberikan secara verbatim.
2. Evaluasi penjelasan pengguna berdasarkan LEARNING OUTLINE di bawah (ini acuan kebenaran/rubrik).
3. Beri skor 0–10 dan feedback.

RUBRIK PENILAIAN (bobot):
- comprehensiveness (40%): seberapa banyak poin outline yang tercakup dan dijelaskan.
- accuracy (35%): apakah penjelasan benar secara konsep, tanpa miskonsepsi.
- clarity (25%): apakah penjelasan mudah dipahami orang awam (inti Feynman Technique).
Skor keseluruhan dihitung oleh sistem dari ketiga sub-skor dengan bobot di atas; kamu TIDAK perlu menghitungnya.

LEARNING OUTLINE (acuan kebenaran):
${outlineText}

CATATAN PRIBADI PENGGUNA (konteks tambahan, BUKAN rubrik wajib):
${notesText}

HINT YANG DIPAKAI: ${HINT_LABEL[hintLevel]} (skor maksimum sistem untuk attempt ini: ${maxScore}). Nilai setiap sub-skor apa adanya; pembatasan skor dilakukan oleh sistem, bukan olehmu.

FORMAT OUTPUT (JSON):
- "transcript": hasil transkrip audio.
- "sub_scores": { "comprehensiveness", "accuracy", "clarity" } masing-masing bilangan bulat 0–10.
- "coverage": satu entri untuk SETIAP poin outline, berisi { "topic" (judul poin), "status" ("covered" | "partial" | "missing"), "note" (penjelasan singkat) }.
- "feedback": paragraf feedback yang membangun dan menyemangati.
- "strengths": daftar 1–3 kekuatan penjelasan.
- "improvements": daftar 1–3 saran perbaikan untuk attempt berikutnya.

Tulis transcript apa adanya; tulis feedback, note, strengths, dan improvements dalam Bahasa Indonesia.`;
}
