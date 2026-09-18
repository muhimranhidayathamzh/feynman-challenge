"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { SOURCE_TYPE_META, formatDuration } from "@/lib/utils/labels";
import type { SourceType } from "@/types";

interface OutlineItem {
  title: string;
  description: string;
}

interface PlanSource {
  title: string;
  url: string | null;
  type: SourceType;
}

interface GeneratedPlan {
  outline: OutlineItem[];
  sources: PlanSource[];
  estimated_duration_sec: number;
}

interface GenerateResponse extends Partial<GeneratedPlan> {
  error?: string;
}

interface CreateResponse {
  id?: string;
  error?: string;
}

type Status = "idle" | "generating" | "preview" | "creating";

export function CreateForm() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const busy = status === "generating" || status === "creating";
  const editing = status === "idle" || status === "generating";

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (topic.trim().length < 3) {
      setError("Topik minimal 3 karakter.");
      return;
    }
    setError(null);
    setStatus("generating");

    try {
      const res = await fetch("/api/challenge/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() }),
      });
      const data: GenerateResponse = await res.json();

      if (
        !res.ok ||
        !data.outline ||
        !data.sources ||
        typeof data.estimated_duration_sec !== "number"
      ) {
        setError(data.error ?? "Gagal membuat rencana belajar. Coba lagi.");
        setStatus("idle");
        return;
      }

      setPlan({
        outline: data.outline,
        sources: data.sources,
        estimated_duration_sec: data.estimated_duration_sec,
      });
      setStatus("preview");
    } catch {
      setError("Terjadi kesalahan jaringan. Coba lagi.");
      setStatus("idle");
    }
  }

  async function handleCreate() {
    if (!plan) return;
    setError(null);
    setStatus("creating");

    const deadlineIso = deadline ? new Date(`${deadline}T23:59:59`).toISOString() : null;

    try {
      const res = await fetch("/api/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          deadline: deadlineIso,
          estimated_duration_sec: plan.estimated_duration_sec,
          outline: plan.outline,
          sources: plan.sources,
        }),
      });
      const data: CreateResponse = await res.json();

      if (!res.ok || !data.id) {
        setError(data.error ?? "Gagal membuat challenge. Coba lagi.");
        setStatus("preview");
        return;
      }

      router.push(`/challenge/${data.id}`);
    } catch {
      setError("Terjadi kesalahan jaringan. Coba lagi.");
      setStatus("preview");
    }
  }

  function handleBackToEdit() {
    setStatus("idle");
    setPlan(null);
    setError(null);
  }

  return (
    <div className="stack" style={{ gap: "var(--space-5)" }}>
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {editing && (
        <form
          className="card stack"
          onSubmit={handleGenerate}
          style={{ gap: "var(--space-5)" }}
        >
          <div className="field">
            <label className="label" htmlFor="topic">
              Apa yang ingin kamu kuasai?
            </label>
            <input
              id="topic"
              className="input"
              type="text"
              placeholder="mis. Quantum Entanglement"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              disabled={busy}
              minLength={3}
              maxLength={200}
              required
              autoFocus
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="deadline">
              Deadline <span className="text-muted">(opsional)</span>
            </label>
            <input
              id="deadline"
              className="input"
              type="date"
              value={deadline}
              min={today}
              onChange={(event) => setDeadline(event.target.value)}
              disabled={busy}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg btn-block"
            disabled={busy || topic.trim().length < 3}
          >
            {status === "generating" ? (
              <>
                <span className="animate-spin" aria-hidden="true">
                  ◌
                </span>
                AI sedang menyusun…
              </>
            ) : (
              "🚀 Generate Learning Plan"
            )}
          </button>
        </form>
      )}

      {status === "generating" && <PreviewSkeleton />}

      {(status === "preview" || status === "creating") && plan && (
        <div className="card stack animate-fade-in-up" style={{ gap: "var(--space-5)" }}>
          <div className="row-between">
            <h3>Rencana Belajar</h3>
            <span className="badge" title="Estimasi durasi rekaman">
              ⏱️ {formatDuration(plan.estimated_duration_sec)}
            </span>
          </div>

          <div className="stack" style={{ gap: "var(--space-3)" }}>
            <h4 className="text-secondary text-sm">📋 Learning Outline</h4>
            <ol className="stack" style={{ gap: "var(--space-3)" }}>
              {plan.outline.map((item, index) => (
                <li
                  key={`${index}-${item.title}`}
                  className="row"
                  style={{ alignItems: "flex-start", gap: "var(--space-3)" }}
                >
                  <span className="badge" aria-hidden="true">
                    {index + 1}
                  </span>
                  <div className="stack" style={{ gap: "var(--space-1)" }}>
                    <span className="font-semibold">{item.title}</span>
                    {item.description && (
                      <span className="text-secondary text-sm">{item.description}</span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {plan.sources.length > 0 && (
            <div className="stack" style={{ gap: "var(--space-3)" }}>
              <h4 className="text-secondary text-sm">📚 Sumber Belajar</h4>
              <ul className="stack" style={{ gap: "var(--space-2)" }}>
                {plan.sources.map((source, index) => (
                  <li
                    key={`${index}-${source.title}`}
                    className="row"
                    style={{ gap: "var(--space-2)" }}
                  >
                    <span aria-hidden="true">{SOURCE_TYPE_META[source.type].icon}</span>
                    {source.url ? (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-accent text-sm"
                      >
                        {source.title}
                      </a>
                    ) : (
                      <span className="text-sm">{source.title}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="row" style={{ gap: "var(--space-3)" }}>
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={handleCreate}
              disabled={status === "creating"}
            >
              {status === "creating" ? "Menyimpan…" : "✓ Buat Challenge"}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleBackToEdit}
              disabled={status === "creating"}
            >
              Ganti topik
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PreviewSkeleton() {
  return (
    <div className="card stack" style={{ gap: "var(--space-4)" }} aria-hidden="true">
      <div className="skeleton" style={{ height: "1.5rem", width: "40%" }} />
      <div className="skeleton" style={{ height: "1rem", width: "90%" }} />
      <div className="skeleton" style={{ height: "1rem", width: "80%" }} />
      <div className="skeleton" style={{ height: "1rem", width: "85%" }} />
      <div className="skeleton" style={{ height: "1rem", width: "70%" }} />
    </div>
  );
}
