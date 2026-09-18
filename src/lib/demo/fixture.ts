// ============================================================================
// Demo fixture: one fully worked example challenge for anonymous "Coba tanpa
// akun" visitors. Seeded without calling Gemini, so trying the app costs no AI
// quota. The attempt reads like a real first try: two points covered, one
// partial, one missing, so every part of the results page has something to
// show (coverage, "Pelajari lagi", jargon, follow-up questions).
// ============================================================================
import type { FollowUpQuestion } from "@/lib/utils/followups";
import type { Coverage, SourceType } from "@/types";

export interface DemoOutlineItem {
  title: string;
  description: string;
  keywords: string[];
  guiding_question: string;
}

export const DEMO_CHALLENGE = {
  title: "Fotosintesis",
  recordingDurationSec: 180,
  deadlineInDays: 5,
} as const;

export const DEMO_OUTLINE: DemoOutlineItem[] = [
  {
    title: "Apa itu fotosintesis",
    description:
      "Proses tumbuhan mengubah energi cahaya menjadi energi kimia yang tersimpan dalam gula.",
    keywords: ["energi cahaya", "energi kimia", "glukosa", "autotrof"],
    guiding_question: "Dari mana tumbuhan mendapatkan “makanannya”?",
  },
  {
    title: "Bahan dan hasil",
    description:
      "Karbon dioksida dan air, dengan bantuan cahaya, menjadi glukosa dan oksigen.",
    keywords: ["karbon dioksida", "air", "oksigen", "persamaan reaksi"],
    guiding_question: "Apa yang masuk ke daun, dan apa yang keluar?",
  },
  {
    title: "Peran klorofil dan kloroplas",
    description:
      "Klorofil di dalam kloroplas menyerap cahaya merah dan biru, lalu memantulkan hijau.",
    keywords: ["klorofil", "kloroplas", "spektrum cahaya"],
    guiding_question: "Kenapa daun berwarna hijau?",
  },
  {
    title: "Reaksi terang dan siklus Calvin",
    description:
      "Reaksi terang menghasilkan ATP dan NADPH; siklus Calvin memakainya untuk mengikat CO₂ menjadi gula.",
    keywords: ["reaksi terang", "ATP", "NADPH", "siklus Calvin"],
    guiding_question: "Kenapa fotosintesis butuh dua tahap?",
  },
];

export const DEMO_SOURCES: { title: string; url: string; source_type: SourceType }[] = [
  {
    title: "Fotosintesis — Wikipedia bahasa Indonesia",
    url: "https://id.wikipedia.org/wiki/Fotosintesis",
    source_type: "article",
  },
  {
    title: "Photosynthesis — Khan Academy",
    url: "https://www.khanacademy.org/science/biology/photosynthesis-in-plants",
    source_type: "video",
  },
];

export const DEMO_NOTES = `## Ringkasan
- **Rumus**: 6CO₂ + 6H₂O + cahaya → C₆H₁₂O₆ + 6O₂
- Terjadi di **kloroplas**; pigmen penyerap cahayanya **klorofil**.
- Dua tahap: **reaksi terang** (di tilakoid) dan **siklus Calvin** (di stroma).

## Analogi
Daun itu dapur bertenaga surya. Cahaya adalah kompornya, CO₂ dan air bahannya,
gula masakannya, dan oksigen “asap” yang kebetulan kita butuhkan.

> Ini tantangan contoh. Coba rekam penjelasanmu sendiri, lalu bandingkan hasilnya.
`;

export const DEMO_ATTEMPT = {
  durationSeconds: 142,
  subScores: { comprehensiveness: 6, accuracy: 8, clarity: 7 },
  transcript:
    "Oke, jadi fotosintesis itu cara tumbuhan bikin makanannya sendiri. Tumbuhan nggak makan kayak kita, " +
    "dia pakai energi dari cahaya matahari terus diubah jadi energi kimia dalam bentuk gula, glukosa. " +
    "Bahannya ada dua: karbon dioksida yang diambil dari udara lewat daun, sama air yang diserap dari akar. " +
    "Hasilnya glukosa buat energi tumbuhan, dan oksigen yang dilepas ke udara, yang kita hirup. " +
    "Jadi kayak dapur tenaga surya gitu. Terus kenapa daun hijau, itu karena ada klorofil di kloroplas. " +
    "Klorofil itu yang menangkap cahaya. Hmm, ada tahap-tahapnya juga sih, tapi saya lupa detailnya.",
  feedback:
    "Penjelasanmu tentang apa itu fotosintesis serta bahan dan hasilnya sudah jelas, dan analogi dapur " +
    "tenaga surya sangat membantu. Bagian klorofil baru setengah: kamu menyebut klorofil menangkap cahaya, " +
    "tapi belum menjelaskan kenapa daun terlihat hijau. Dua tahap fotosintesis belum dibahas sama sekali.",
  strengths: [
    "Membuka dengan gambaran besar yang mudah dipahami: tumbuhan membuat makanannya sendiri.",
    "Bahan dan hasil disebut lengkap, termasuk dari mana tiap bahan berasal.",
    "Analogi dapur tenaga surya membuat konsepnya terasa konkret.",
  ],
  improvements: [
    "Jelaskan kenapa daun hijau: klorofil menyerap merah dan biru, lalu memantulkan hijau.",
    "Tambahkan dua tahap: reaksi terang menghasilkan ATP dan NADPH, siklus Calvin memakainya untuk membuat gula.",
    "Jelaskan “kloroplas” dengan kata sederhana, misalnya “dapur kecil di dalam sel daun”.",
  ],
  coverage: [
    {
      outline_index: 1,
      topic: "Apa itu fotosintesis",
      status: "covered",
      note: "Tepat dan sederhana: energi cahaya diubah menjadi energi kimia berupa gula.",
      evidence:
        "dia pakai energi dari cahaya matahari terus diubah jadi energi kimia dalam bentuk gula",
    },
    {
      outline_index: 2,
      topic: "Bahan dan hasil",
      status: "covered",
      note: "Kedua bahan dan kedua hasil disebut, lengkap dengan asalnya.",
      evidence:
        "karbon dioksida yang diambil dari udara lewat daun, sama air yang diserap dari akar",
    },
    {
      outline_index: 3,
      topic: "Peran klorofil dan kloroplas",
      status: "partial",
      note: "Klorofil disebut menangkap cahaya, tapi hubungannya dengan warna hijau belum dijelaskan.",
      evidence: "kenapa daun hijau, itu karena ada klorofil di kloroplas",
    },
    {
      outline_index: 4,
      topic: "Reaksi terang dan siklus Calvin",
      status: "missing",
      note: "Tahapan fotosintesis belum dibahas.",
      evidence: "",
    },
  ] satisfies Coverage[],
  unexplainedJargon: ["kloroplas"],
  followUpQuestions: [
    {
      question:
        "Kalau klorofil menyerap cahaya merah dan biru, kenapa daun justru terlihat hijau?",
      outline_index: 3,
    },
    {
      question:
        "Energi dari cahaya disimpan dulu dalam bentuk apa sebelum dipakai untuk membuat gula?",
      outline_index: 4,
    },
  ] satisfies FollowUpQuestion[],
};
