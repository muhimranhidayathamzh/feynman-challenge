// ============================================================================
// Demo fixture: one fully worked example challenge for anonymous "Coba tanpa
// akun" visitors, also shown on the public landing page. Seeded without
// calling Gemini, so trying the app costs no AI quota. The attempt reads like
// a real first try: two points covered, one partial, one missing, so every
// part of the results page has something to show (coverage, "Pelajari lagi",
// jargon, follow-up questions).
//
// The topic is deliberately adult and everyday (V.8): the first example a
// visitor meets sets who the product is for.
//
// Every non-missing `evidence` must appear word for word in `transcript`,
// or its highlight never shows. fixture.test.ts enforces that.
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
  title: "Bunga majemuk",
  recordingDurationSec: 180,
  deadlineInDays: 5,
} as const;

export const DEMO_OUTLINE: DemoOutlineItem[] = [
  {
    title: "Apa itu bunga majemuk",
    description:
      "Bunga dihitung dari pokok ditambah bunga yang sudah terkumpul, sehingga bunga ikut berbunga.",
    keywords: ["pokok", "bunga berbunga", "periode", "saldo"],
    guiding_question: "Apa bedanya dengan bunga yang hanya dihitung dari pokok?",
  },
  {
    title: "Bunga majemuk dan bunga tunggal",
    description:
      "Bunga tunggal hanya menghitung pokok. Selisih keduanya kecil di awal dan melebar seiring waktu.",
    keywords: ["bunga tunggal", "pokok", "selisih"],
    guiding_question:
      "Dua orang menabung dengan suku bunga sama. Kenapa hasilnya bisa beda jauh?",
  },
  {
    title: "Peran waktu",
    description:
      "Pertumbuhannya makin lama makin cepat, jadi mulai lebih awal sering lebih menentukan daripada besar setoran.",
    keywords: ["eksponensial", "jangka panjang", "mulai lebih awal", "aturan 72"],
    guiding_question:
      "Kenapa uang yang mulai ditabung lebih awal bisa tumbuh jauh lebih besar?",
  },
  {
    title: "Dampaknya di kehidupan nyata",
    description:
      "Menguntungkan untuk tabungan dan investasi, merugikan untuk utang yang bunganya ikut dibungakan.",
    keywords: ["investasi", "kartu kredit", "utang", "pinjaman"],
    guiding_question: "Di mana bunga majemuk justru bekerja melawanmu?",
  },
];

// Both verified to exist (and a made-up page on the same site to 404).
export const DEMO_SOURCES: { title: string; url: string; source_type: SourceType }[] = [
  {
    title: "Bunga majemuk — Wikipedia bahasa Indonesia",
    url: "https://id.wikipedia.org/wiki/Bunga_majemuk",
    source_type: "article",
  },
  {
    title: "Compound interest — Wikipedia",
    url: "https://en.wikipedia.org/wiki/Compound_interest",
    source_type: "article",
  },
];

export const DEMO_NOTES = `## Ringkasan
- **Bunga tunggal**: bunga = pokok × suku bunga × waktu. Yang dibungakan hanya pokok.
- **Bunga majemuk**: saldo akhir = pokok × (1 + suku bunga)ⁿ. Bunga tiap periode ikut dibungakan.
- **Aturan 72**: 72 dibagi suku bunga tahunan kira-kira sama dengan berapa tahun sampai uang berlipat dua.

## Analogi
Bola salju yang menggelinding: makin besar bolanya, makin banyak salju yang menempel di putaran berikutnya.

> Ini tantangan contoh. Coba rekam penjelasanmu sendiri, lalu bandingkan hasilnya.
`;

export const DEMO_ATTEMPT = {
  durationSeconds: 142,
  subScores: { comprehensiveness: 6, accuracy: 8, clarity: 7 },
  transcript:
    "Oke, jadi bunga majemuk itu bunga yang dihitung dari uang awal ditambah bunga yang sudah didapat sebelumnya. " +
    "Jadi bunganya ikut berbunga, makanya sering disebut bunga berbunga. " +
    "Beda sama bunga tunggal, yang cuma dihitung dari uang awal saja. " +
    "Misalnya nabung sepuluh juta dengan bunga sepuluh persen setahun. Tahun pertama sama-sama dapat satu juta. " +
    "Tapi tahun kedua, yang majemuk dapat bunga dari sebelas juta, jadi satu koma satu juta. " +
    "Selisihnya kecil di awal, tapi makin lama makin jauh. " +
    "Terus katanya pertumbuhannya eksponensial, jadi makin lama nabung hasilnya makin besar. " +
    "Hmm, sebenarnya ada rumus buat ngitung kapan uangnya jadi dua kali lipat, tapi saya lupa.",
  feedback:
    "Penjelasanmu tentang apa itu bunga majemuk dan bedanya dengan bunga tunggal sudah jelas, dan contoh " +
    "sepuluh juta membuatnya mudah diikuti. Bagian waktu baru setengah: kamu menyebut hasilnya makin besar, " +
    "tapi belum menjelaskan kenapa mulai lebih awal begitu berpengaruh. Dampaknya di kehidupan nyata, " +
    "termasuk pada utang, belum dibahas sama sekali.",
  strengths: [
    "Definisinya tepat, dan istilah “bunga berbunga” dijelaskan artinya.",
    "Contoh sepuluh juta membuat perbedaan dengan bunga tunggal langsung terlihat.",
    "Menyadari bahwa selisihnya kecil di awal lalu melebar seiring waktu.",
  ],
  improvements: [
    "Jelaskan kenapa waktu begitu berpengaruh: bunga tahun ini ikut dibungakan tahun depan, jadi pertumbuhannya makin cepat, bukan sekadar makin banyak.",
    "Tambahkan sisi sebaliknya: utang kartu kredit yang bunganya ikut dibungakan bisa membengkak dengan cara yang sama.",
    "Jelaskan “eksponensial” dengan kata sederhana, misalnya “tumbuhnya makin lama makin cepat”.",
  ],
  coverage: [
    {
      outline_index: 1,
      topic: "Apa itu bunga majemuk",
      status: "covered",
      note: "Tepat: bunga dihitung dari pokok ditambah bunga sebelumnya, dan istilah “bunga berbunga” dijelaskan.",
      evidence:
        "bunga yang dihitung dari uang awal ditambah bunga yang sudah didapat sebelumnya",
    },
    {
      outline_index: 2,
      topic: "Bunga majemuk dan bunga tunggal",
      status: "covered",
      note: "Perbedaannya jelas, dan contoh angkanya membuat selisihnya konkret.",
      evidence: "tahun kedua, yang majemuk dapat bunga dari sebelas juta",
    },
    {
      outline_index: 3,
      topic: "Peran waktu",
      status: "partial",
      note: "Kamu menyebut hasilnya makin besar seiring waktu, tapi belum menjelaskan kenapa mulai lebih awal begitu berpengaruh.",
      evidence: "makin lama nabung hasilnya makin besar",
    },
    {
      outline_index: 4,
      topic: "Dampaknya di kehidupan nyata",
      status: "missing",
      note: "Belum dibahas, termasuk bagaimana bunga majemuk bekerja melawanmu pada utang.",
      evidence: "",
    },
  ] satisfies Coverage[],
  unexplainedJargon: ["eksponensial"],
  followUpQuestions: [
    {
      question:
        "Dengan suku bunga yang sama, kenapa uang yang mulai ditabung sepuluh tahun lebih awal bisa tumbuh jauh lebih besar?",
      outline_index: 3,
    },
    {
      question:
        "Kenapa utang kartu kredit yang tidak dilunasi bisa membengkak jauh lebih cepat dari perkiraan?",
      outline_index: 4,
    },
  ] satisfies FollowUpQuestion[],
};
