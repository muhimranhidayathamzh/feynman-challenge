"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { MasteryState } from "@/types";

import { DeadlineBadge } from "./deadline-badge";
import { MasteryIndicator } from "./mastery-indicator";

const JSON_HEADERS = { "Content-Type": "application/json" };

interface Props {
  id: string;
  initialTitle: string;
  masteryState: MasteryState;
  deadline: string | null;
  extendedDeadline: string | null;
}

export function NotebookHeader({
  id,
  initialTitle,
  masteryState,
  deadline,
  extendedDeadline,
}: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [draft, setDraft] = useState(initialTitle);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    try {
      const res = await fetch(`/api/challenge/${id}`, {
        method: "PATCH",
        headers: JSON_HEADERS,
        body: JSON.stringify({ title: trimmed }),
      });
      if (!res.ok) {
        setError("Gagal menyimpan judul.");
        return;
      }
      setTitle(trimmed);
      setEditing(false);
    } catch {
      setError("Kesalahan jaringan. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Hapus challenge ini beserta semua datanya?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/challenge/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setError("Gagal menghapus challenge.");
        setBusy(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Kesalahan jaringan. Coba lagi.");
      setBusy(false);
    }
  }

  return (
    <div className="stack" style={{ gap: "var(--space-3)" }}>
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      <div
        className="row-between"
        style={{ alignItems: "flex-start", gap: "var(--space-3)" }}
      >
        {editing ? (
          <div className="stack" style={{ flex: 1, gap: "var(--space-2)" }}>
            <input
              className="input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={200}
              aria-label="Judul challenge"
              autoFocus
            />
            <div className="row" style={{ gap: "var(--space-2)" }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={saveTitle}
                disabled={busy}
              >
                Simpan
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setDraft(title);
                  setEditing(false);
                  setError(null);
                }}
                disabled={busy}
              >
                Batal
              </button>
            </div>
          </div>
        ) : (
          <h1 style={{ flex: 1 }}>{title}</h1>
        )}

        <div className="row" style={{ gap: 0 }}>
          {!editing && (
            <button
              type="button"
              className="icon-btn"
              onClick={() => {
                setDraft(title);
                setEditing(true);
              }}
              disabled={busy}
              aria-label="Edit judul"
              title="Edit judul"
            >
              ✏️
            </button>
          )}
          <button
            type="button"
            className="icon-btn"
            data-danger="true"
            onClick={handleDelete}
            disabled={busy}
            aria-label="Hapus challenge"
            title="Hapus challenge"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="row" style={{ gap: "var(--space-2)", flexWrap: "wrap" }}>
        <MasteryIndicator state={masteryState} />
        <DeadlineBadge deadline={deadline} extendedDeadline={extendedDeadline} />
      </div>
    </div>
  );
}
