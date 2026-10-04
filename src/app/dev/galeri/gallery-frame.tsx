"use client";

import { useEffect, type ReactNode } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";
import { AttemptHistory } from "@/components/challenge/attempt-history";
import { NewChallengeView } from "@/components/challenge/new-challenge-view";
import { NotebookView } from "@/components/challenge/notebook-view";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import {
  EvaluationCompletedView,
  EvaluationRejectedView,
  EvaluationStatusView,
} from "@/components/evaluation/evaluation-views";
import { FollowUpSection } from "@/components/evaluation/follow-up-section";
import { AppShell } from "@/components/layout/app-shell";
import { Landing } from "@/components/marketing/landing";
import { pickQuestion } from "@/lib/utils/landing-questions";
import { OfflineScreen } from "@/components/pwa/offline-screen";
import {
  RecordingStage,
  type RecordingStageProps,
} from "@/components/recording/recording-stage";
import { SettingsView } from "@/components/settings/settings-view";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { DEMO_CHALLENGE } from "@/lib/demo/fixture";
import { DASHBOARD_TABS } from "@/lib/utils/challenge-status";
import { formatDay } from "@/lib/utils/date";
import { weekStrip } from "@/lib/utils/streak";
import type { HintLevel } from "@/types";
import NotFound from "@/app/not-found";

import { ComponentSheet } from "./component-sheet";
import * as fx from "./fixtures";
import { findFrame } from "./frame-list";

const noop = () => undefined;
const ACTIVE_TAB = DASHBOARD_TABS[0]!;

function Dashboard({ empty = false }: { empty?: boolean }) {
  return (
    <DashboardView
      displayName={fx.DISPLAY_NAME}
      streak={empty ? 0 : 4}
      week={weekStrip(fx.TODAY, empty ? null : fx.TODAY, empty ? 0 : 4)}
      dateLabel={formatDay(fx.TODAY)}
      activeTab={ACTIVE_TAB}
      data={empty ? fx.dashboardEmpty : fx.dashboardFull}
    />
  );
}

function stage(overrides: Partial<RecordingStageProps>): ReactNode {
  const props: RecordingStageProps = {
    challengeId: fx.CHALLENGE_ID,
    title: DEMO_CHALLENGE.title,
    durationSec: 180,
    elapsedSec: 0,
    status: "idle",
    stream: null,
    recorderError: null,
    submitError: null,
    preparingHints: false,
    hints: { ...fx.recordingHints, revealed: new Set<HintLevel>(), cap: 10 },
    review: null,
    onStart: noop,
    onPause: noop,
    onResume: noop,
    onFinish: noop,
    onReveal: noop,
    onSubmit: noop,
    onRerecord: noop,
    onDiscard: noop,
    ...overrides,
  };
  return <RecordingStage {...props} />;
}

const KEYWORDS_REVEALED = new Set<HintLevel>(["keywords"]);

function ToastDemo() {
  const { show } = useToast();
  useEffect(() => {
    show({
      message: "Versi baru tersedia.",
      tone: "info",
      durationMs: 0,
      action: { label: "Muat ulang", onClick: noop },
    });
    show({ message: "Catatan tersimpan.", tone: "success", durationMs: 0 });
  }, [show]);
  return null;
}

function content(id: string): ReactNode {
  switch (id) {
    case "komponen":
      return <ComponentSheet />;
    case "landing":
      // Pinned to the first question so screenshots are identical on every run.
      return (
        <Landing
          features={{ google: true, anonymous: true }}
          question={pickQuestion(0)}
        />
      );
    case "login":
      return (
        <LoginForm
          next="/"
          initialError={null}
          features={{ google: true, anonymous: true }}
        />
      );
    case "daftar":
      return <SignupForm googleEnabled />;
    case "offline":
      return <OfflineScreen />;
    case "404":
      return <NotFound />;
    case "dashboard-kosong":
      return <Dashboard empty />;
    case "dashboard-isi":
    case "dashboard-demo":
      return <Dashboard />;
    case "buat-tantangan":
      return <NewChallengeView />;
    case "catatan":
      return <NotebookView {...fx.notebook} />;
    case "catatan-riwayat":
      return (
        <section className="page">
          <AttemptHistory entries={fx.longHistory} />
        </section>
      );
    case "rekam-siap":
      return stage({});
    case "rekam-merekam":
      return stage({
        status: "recording",
        elapsedSec: 74,
        hints: { ...fx.recordingHints, revealed: KEYWORDS_REVEALED, cap: 9 },
      });
    case "rekam-jeda":
      return stage({ status: "paused", elapsedSec: 101 });
    case "rekam-izin":
      return stage({
        recorderError: {
          code: "permission-denied",
          message: "Izin mikrofon ditolak. Aktifkan akses mikrofon untuk merekam.",
        },
      });
    case "rekam-dengarkan":
      return stage({
        status: "stopped",
        elapsedSec: 142,
        hints: { ...fx.recordingHints, revealed: KEYWORDS_REVEALED, cap: 9 },
        review: {
          durationSeconds: 142,
          previewUrl: null,
          phase: "review",
          progressPct: 0,
          tooShort: false,
        },
      });
    case "rekam-mengunggah":
      return stage({
        status: "stopped",
        elapsedSec: 142,
        review: {
          durationSeconds: 142,
          previewUrl: null,
          phase: "uploading",
          progressPct: 45,
          tooShort: false,
        },
      });
    case "hasil-selesai":
      return (
        <EvaluationCompletedView
          {...fx.result}
          followUp={
            <FollowUpSection
              attemptId={fx.ATTEMPT_ID}
              challengeId={fx.CHALLENGE_ID}
              userId={fx.USER_ID}
              questions={fx.followUpQuestions}
              initialAnswers={fx.followUpAnswers}
              outlineTitles={fx.outlineTitles}
            />
          }
        />
      );
    case "hasil-ditolak":
      return (
        <EvaluationRejectedView
          challengeId={fx.CHALLENGE_ID}
          audioIssue="silent"
          feedback={null}
          audioUrl={null}
          neighbours={fx.neighbours.rejected}
        />
      );
    case "hasil-diproses":
      return (
        <EvaluationStatusView
          challengeId={fx.CHALLENGE_ID}
          view="evaluating"
          error={null}
          onRetry={noop}
          onReload={noop}
          neighbours={fx.neighbours.failed}
        />
      );
    case "hasil-gagal":
      return (
        <EvaluationStatusView
          challengeId={fx.CHALLENGE_ID}
          view="error"
          error="Layanan AI sedang sibuk. Rekamanmu aman, coba nilai ulang sebentar lagi."
          onRetry={noop}
          onReload={noop}
          neighbours={fx.neighbours.failed}
        />
      );
    case "pengaturan":
      return (
        <SettingsView
          displayName={fx.DISPLAY_NAME}
          timezone="Asia/Jakarta"
          timezones={fx.TIMEZONES}
          email="rani@contoh.id"
          isDemo={false}
          pendingEmail={null}
          hasPassword
          justConverted={false}
          theme="system"
        />
      );
    case "pengaturan-demo":
      return (
        <SettingsView
          displayName="Tamu"
          timezone="Asia/Jakarta"
          timezones={fx.TIMEZONES}
          email={null}
          isDemo
          pendingEmail={null}
          hasPassword={false}
          justConverted={false}
          theme="system"
        />
      );
    case "dialog":
      return (
        <>
          <Dashboard />
          <ConfirmDialog
            open
            title="Hapus tantangan ini?"
            message={`Outline, catatan, sumber, dan semua rekaman untuk “${DEMO_CHALLENGE.title}” akan dihapus permanen.`}
            confirmLabel="Hapus"
            tone="danger"
            onConfirm={noop}
            onCancel={noop}
          />
        </>
      );
    case "toast":
      return (
        <>
          <Dashboard />
          <ToastDemo />
        </>
      );
    default:
      return null;
  }
}

/** Renders one gallery screen inside the same shell the real route uses. */
export function GalleryFrame({ id }: { id: string }) {
  const meta = findFrame(id);
  if (!meta) return null;
  const body = content(id);

  if (meta.shell === "app") {
    return (
      <AppShell
        displayName={
          id === "dashboard-demo" || id === "pengaturan-demo" ? "Tamu" : fx.DISPLAY_NAME
        }
        isAnonymous={id === "dashboard-demo" || id === "pengaturan-demo"}
        currentPath={meta.path}
      >
        {body}
      </AppShell>
    );
  }
  if (meta.shell === "auth") return <AuthShell>{body}</AuthShell>;
  return body;
}
