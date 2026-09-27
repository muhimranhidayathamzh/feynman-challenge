"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Pencil, Settings2, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import { ChallengePatchResponseSchema, OkResponseSchema } from "@/lib/api/contracts";
import { fetchJson } from "@/lib/api/fetch-json";
import type { DeadlineInfo } from "@/lib/utils/deadline";
import { STATUS_LABEL } from "@/lib/utils/challenge-status";
import type { ChallengeStatus, MasteryState } from "@/types";

import { ChallengeActions } from "./challenge-actions";
import { DeadlineBadge } from "./deadline-badge";
import { LeitnerStrip } from "./leitner-strip";
import { MasteryMeter } from "./mastery-meter";

interface Props {
  id: string;
  initialTitle: string;
  masteryState: MasteryState;
  status: ChallengeStatus;
  /** Stored deadline "YYYY-MM-DD" (for the reschedule dialog). */
  deadline: string | null;
  /** Computed on the server in the user's timezone. */
  deadlineInfo: DeadlineInfo;
  /** e.g. "Review berikutnya: 22 Sep" (spaced repetition), or null. */
  nextReview: string | null;
  /** challenges.review_box (0-based). */
  reviewBox: number;
}

export function NotebookHeader({
  id,
  initialTitle,
  masteryState,
  status,
  deadline,
  deadlineInfo,
  nextReview,
  reviewBox,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [title, setTitle] = useState(initialTitle);
  const [draft, setDraft] = useState(initialTitle);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const manageRef = useRef<HTMLDetailsElement>(null);

  /** The title field unmounts on save or cancel: return focus where it came from. */
  function leaveEditing() {
    setEditing(false);
    manageRef.current?.querySelector("summary")?.focus();
  }

  // Only nag when the review is actually due; the strip shows the schedule.
  const reviewDue =
    nextReview !== null &&
    (nextReview === "Review hari ini" || nextReview.startsWith("Review terlambat"));

  async function saveTitle() {
    const trimmed = draft.trim();
    if (trimmed.length < 3) {
      setError("Judul minimal 3 karakter.");
      return;
    }
    if (trimmed === title) {
      leaveEditing();
      return;
    }
    setBusy(true);
    setError(null);
    const result = await fetchJson(`/api/challenge/${id}`, ChallengePatchResponseSchema, {
      method: "PATCH",
      json: { title: trimmed },
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setTitle(result.data.challenge.title);
    leaveEditing();
    toast.show({ message: "Judul disimpan.", tone: "success" });
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    const result = await fetchJson(`/api/challenge/${id}`, OkResponseSchema, {
      method: "DELETE",
    });
    if (!result.ok) {
      setDeleting(false);
      setConfirmingDelete(false);
      toast.show({ message: result.error, tone: "error" });
      return;
    }
    toast.show({ message: "Tantangan dihapus.", tone: "success" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="notebook-head">
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {editing ? (
        <div className="stack gap-2">
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={200}
            aria-label="Judul tantangan"
            autoFocus
          />
          <div className="row gap-2">
            <Button size="sm" icon={Check} onClick={saveTitle} loading={busy}>
              Simpan
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDraft(title);
                setError(null);
                leaveEditing();
              }}
              disabled={busy}
            >
              Batal
            </Button>
          </div>
        </div>
      ) : (
        <div className="stack gap-1">
          <p className="notebook-eyebrow">Catatan belajar</p>
          <h1 className="notebook-title">{title}</h1>
        </div>
      )}

      {/* What matters at a glance: how well, and when it comes back. */}
      <div className="notebook-meta">
        <MasteryMeter state={masteryState} />
        <div className="row flex-wrap items-center gap-2">
          {status !== "active" ? (
            <Badge tone={status === "completed" ? "success" : "neutral"}>
              {STATUS_LABEL[status]}
            </Badge>
          ) : (
            <DeadlineBadge info={deadlineInfo} />
          )}
          {reviewDue ? (
            <Badge tone="warning">{nextReview}</Badge>
          ) : (
            nextReview && <span className="text-muted text-sm">{nextReview}</span>
          )}
        </div>
      </div>

      {/* The machinery, folded (V.7): review boxes and every way to change
          this challenge, instead of ten controls above its first line. */}
      <details className="notebook-manage" ref={manageRef}>
        <summary className="notebook-manage-summary">
          <Icon icon={Settings2} size={16} />
          Kelola tantangan
          <ChevronDown className="notebook-manage-chevron" size={16} aria-hidden="true" />
        </summary>
        <div className="notebook-manage-body">
          {nextReview && <LeitnerStrip box={reviewBox} nextReview={nextReview} />}
          <ChallengeActions challengeId={id} status={status} deadline={deadline} />
          <div className="row flex-wrap gap-2 notebook-manage-danger">
            <Button
              variant="ghost"
              size="sm"
              icon={Pencil}
              onClick={() => {
                setDraft(title);
                setEditing(true);
                if (manageRef.current) manageRef.current.open = false;
              }}
              disabled={busy || editing}
            >
              Ubah judul
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={Trash2}
              className="manage-delete"
              onClick={() => setConfirmingDelete(true)}
              disabled={busy}
            >
              Hapus tantangan
            </Button>
          </div>
        </div>
      </details>

      <ConfirmDialog
        open={confirmingDelete}
        title="Hapus tantangan ini?"
        message="Outline, sumber, catatan, semua percobaan, dan rekamannya akan dihapus permanen."
        confirmLabel="Hapus"
        tone="danger"
        busy={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmingDelete(false)}
      />
    </header>
  );
}
