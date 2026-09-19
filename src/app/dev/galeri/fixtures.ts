// ============================================================================
// Dev gallery fixtures: fixed data for every screen state, so screenshots are
// identical on every run. "Today" is pinned; nothing here touches Supabase.
// ============================================================================
import type { FollowupAnswer } from "@/lib/api/contracts";
import { DEMO_ATTEMPT, DEMO_NOTES, DEMO_OUTLINE, DEMO_SOURCES } from "@/lib/demo/fixture";
import type { CalendarDay } from "@/lib/utils/date";
import {
  buildCoverageTrend,
  compareCoverage,
  matchCoverageToOutline,
} from "@/lib/utils/coverage-progress";
import { buildDashboard, type DashboardRow } from "@/lib/utils/dashboard";
import { getDeadlineInfo } from "@/lib/utils/deadline";
import { buildHints } from "@/lib/utils/hints";
import { nextReviewLabel } from "@/lib/utils/review";
import type { Coverage } from "@/types";

export const TODAY: CalendarDay = "2026-09-19";
export const USER_ID = "00000000-0000-4000-8000-000000000001";
export const CHALLENGE_ID = "00000000-0000-4000-8000-0000000000c1";
export const ATTEMPT_ID = "00000000-0000-4000-8000-0000000000a2";
export const DISPLAY_NAME = "Rani";

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
const DASHBOARD_ROWS: DashboardRow[] = [
  {
    id: CHALLENGE_ID,
    title: "Fotosintesis",
    deadline: "2026-09-20",
    mastery_state: "developing",
    latest_score: 7,
    status: "active",
    review_box: 1,
    next_review_at: TODAY,
  },
  {
    id: "00000000-0000-4000-8000-0000000000c2",
    title: "Hukum Newton tentang gerak",
    deadline: "2026-09-16",
    mastery_state: "attempted",
    latest_score: 4,
    status: "active",
    review_box: 0,
    next_review_at: "2026-09-17",
  },
  {
    id: "00000000-0000-4000-8000-0000000000c3",
    title: "Cara kerja vaksin mRNA",
    deadline: "2026-10-04",
    mastery_state: "proficient",
    latest_score: 8,
    status: "active",
    review_box: 2,
    next_review_at: "2026-09-24",
  },
  {
    id: "00000000-0000-4000-8000-0000000000c4",
    title: "Inflasi dan suku bunga",
    deadline: null,
    mastery_state: "not_started",
    latest_score: null,
    status: "active",
    review_box: 0,
    next_review_at: null,
  },
  {
    id: "00000000-0000-4000-8000-0000000000c5",
    title: "Big O notation",
    deadline: null,
    mastery_state: "mastered",
    latest_score: 9,
    status: "completed",
    review_box: 3,
    next_review_at: "2026-10-01",
  },
  {
    id: "00000000-0000-4000-8000-0000000000c6",
    title: "Sejarah Majapahit",
    deadline: null,
    mastery_state: "developing",
    latest_score: 5,
    status: "parked",
    review_box: 1,
    next_review_at: "2026-09-12",
  },
];

export const dashboardFull = buildDashboard(DASHBOARD_ROWS, TODAY, "active");
export const dashboardEmpty = buildDashboard([], TODAY, "active");

// ---------------------------------------------------------------------------
// Notebook
// ---------------------------------------------------------------------------
export const OUTLINE = DEMO_OUTLINE.map((item, index) => ({
  id: `00000000-0000-4000-8000-00000000010${index}`,
  title: item.title,
  description: item.description,
}));

const FIRST_ATTEMPT_COVERAGE: Coverage[] = DEMO_ATTEMPT.coverage.map((entry) => ({
  ...entry,
  status:
    entry.outline_index === 1
      ? "partial"
      : entry.outline_index === 2
        ? "covered"
        : "missing",
  evidence: "",
}));

const SECOND_ATTEMPT_COVERAGE: Coverage[] = DEMO_ATTEMPT.coverage;

export const notebookTrend = buildCoverageTrend(
  [
    { attemptNumber: 1, coverage: FIRST_ATTEMPT_COVERAGE },
    { attemptNumber: 2, coverage: SECOND_ATTEMPT_COVERAGE },
  ],
  OUTLINE,
);

export const notebook = {
  id: CHALLENGE_ID,
  title: "Fotosintesis",
  masteryState: "developing" as const,
  status: "active" as const,
  deadline: "2026-09-20",
  deadlineInfo: getDeadlineInfo("2026-09-20", TODAY),
  nextReview: nextReviewLabel(TODAY, TODAY),
  outline: OUTLINE,
  trend: notebookTrend,
  sources: DEMO_SOURCES.map((source, index) => ({
    id: `00000000-0000-4000-8000-00000000020${index}`,
    title: source.title,
    url: source.url,
    type: source.source_type,
  })),
  notes: DEMO_NOTES,
};

// ---------------------------------------------------------------------------
// Recording
// ---------------------------------------------------------------------------
const hints = buildHints(
  DEMO_OUTLINE.map((item) => ({
    title: item.title,
    description: item.description,
    keywords: item.keywords,
    guiding_question: item.guiding_question,
  })),
  CHALLENGE_ID,
);

export const recordingHints = {
  keywords: hints.keywords,
  questions: hints.questions,
  outline: DEMO_OUTLINE.map((item) => ({
    title: item.title,
    description: item.description,
  })),
};

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------
const outlineIds = matchCoverageToOutline(SECOND_ATTEMPT_COVERAGE, OUTLINE);

export const result = {
  challengeId: CHALLENGE_ID,
  challengeTitle: "Fotosintesis",
  attemptNumber: 2,
  previous: { score: 6, attemptNumber: 1 },
  maxScore: 10,
  history: [
    { attemptNumber: 1, score: 6 },
    { attemptNumber: 2, score: 7 },
  ],
  overallScore: 7,
  subScores: DEMO_ATTEMPT.subScores,
  coverage: SECOND_ATTEMPT_COVERAGE.map((entry, index) => ({
    ...entry,
    outline_id: outlineIds[index] ?? null,
  })),
  comparison: {
    previousAttemptNumber: 1,
    result: compareCoverage(SECOND_ATTEMPT_COVERAGE, FIRST_ATTEMPT_COVERAGE, OUTLINE),
  },
  unexplainedJargon: DEMO_ATTEMPT.unexplainedJargon,
  feedback: DEMO_ATTEMPT.feedback,
  strengths: DEMO_ATTEMPT.strengths,
  improvements: DEMO_ATTEMPT.improvements,
  transcript: DEMO_ATTEMPT.transcript,
  audioUrl: null,
};

export const followUpQuestions = DEMO_ATTEMPT.followUpQuestions;

export const followUpAnswers: FollowupAnswer[] = [
  {
    question_index: 0,
    transcript:
      "Karena klorofil menyerap cahaya merah sama biru, jadi yang dipantulkan itu hijau, makanya kelihatan hijau.",
    verdict: "tepat",
    feedback: "Tepat. Kamu menghubungkan warna yang diserap dengan warna yang terlihat.",
    hint: null,
  },
];

export const outlineTitles = OUTLINE.map((item) => item.title);

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
export const TIMEZONES = ["Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura", "UTC"];
