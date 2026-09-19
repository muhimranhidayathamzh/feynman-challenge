"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, IconButton } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/field";
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
      setEditing(false);
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
    setEditing(false);
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

      <div className="row-between items-start gap-3">
        {editing ? (
          <div className="stack flex-1 gap-2">
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
                  setEditing(false);
                  setError(null);
                }}
                disabled={busy}
              >
                Batal
              </Button>
            </div>
          </div>
        ) : (
          <div className="stack gap-1 flex-1">
            <p className="notebook-eyebrow">Catatan belajar</p>
            <h1 className="notebook-title">{title}</h1>
          </div>
        )}

        <div className="row gap-0">
          {!editing && (
            <IconButton
              icon={Pencil}
              label="Edit judul"
              onClick={() => {
                setDraft(title);
                setEditing(true);
              }}
              disabled={busy}
            />
          )}
          <IconButton
            icon={Trash2}
            label="Hapus tantangan"
            danger
            onClick={() => setConfirmingDelete(true)}
            disabled={busy}
          />
        </div>
      </div>

      <div className="notebook-meta">
        <MasteryMeter state={masteryState} />
        <div className="row flex-wrap gap-2">
          {status !== "active" ? (
            <Badge tone={status === "completed" ? "success" : "neutral"}>
              {STATUS_LABEL[status]}
            </Badge>
          ) : (
            <DeadlineBadge info={deadlineInfo} />
          )}
          {reviewDue && <Badge tone="warning">{nextReview}</Badge>}
        </div>
      </div>

      {nextReview && <LeitnerStrip box={reviewBox} nextReview={nextReview} />}

      <ChallengeActions challengeId={id} status={status} deadline={deadline} />

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
