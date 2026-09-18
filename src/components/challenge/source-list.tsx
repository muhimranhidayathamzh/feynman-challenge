"use client";

import { useState, type FormEvent } from "react";

import { OkResponseSchema, SourceEnvelopeSchema } from "@/lib/api/contracts";
import { fetchJson } from "@/lib/api/fetch-json";
import { SOURCE_TYPE_META } from "@/lib/utils/labels";
import type { SourceType } from "@/types";

import { SourceItem, type SourceData } from "./source-item";

const SOURCE_TYPES: SourceType[] = ["video", "article", "book", "paper", "other"];

interface Props {
  challengeId: string;
  initialSources: SourceData[];
}

export function SourceList({ challengeId, initialSources }: Props) {
  const [sources, setSources] = useState<SourceData[]>(initialSources);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<SourceType>("article");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const base = `/api/challenge/${challengeId}/sources`;

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    const result = await fetchJson(base, SourceEnvelopeSchema, {
      method: "POST",
      json: { title: trimmed, url: url.trim() || null, type },
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const created = result.data.source;
    setSources((prev) => [
      ...prev,
      {
        id: created.id,
        title: created.title,
        url: created.url,
        type: created.source_type,
      },
    ]);
    setTitle("");
    setUrl("");
    setType("article");
  }

  async function handleRemove(id: string) {
    const rollback = sources;
    setError(null);
    setSources((prev) => prev.filter((s) => s.id !== id));
    const result = await fetchJson(base, OkResponseSchema, {
      method: "DELETE",
      json: { id },
    });
    if (!result.ok) {
      setSources(rollback);
      setError(result.error);
    }
  }

  return (
    <div className="stack" style={{ gap: "var(--space-3)" }}>
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {sources.length === 0 ? (
        <p className="text-muted text-sm">Belum ada sumber belajar.</p>
      ) : (
        <ul className="stack" style={{ gap: "var(--space-2)" }}>
          {sources.map((source) => (
            <SourceItem
              key={source.id}
              source={source}
              disabled={busy}
              onRemove={handleRemove}
            />
          ))}
        </ul>
      )}

      <form className="stack" onSubmit={handleAdd} style={{ gap: "var(--space-2)" }}>
        <input
          className="input"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Judul sumber…"
          maxLength={300}
          disabled={busy}
        />
        <div className="row" style={{ gap: "var(--space-2)" }}>
          <input
            className="input"
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="URL (opsional)"
            disabled={busy}
            style={{ flex: 1 }}
          />
          <select
            className="input"
            value={type}
            onChange={(event) => setType(event.target.value as SourceType)}
            disabled={busy}
            aria-label="Tipe sumber"
            style={{ width: "auto" }}
          >
            {SOURCE_TYPES.map((value) => (
              <option key={value} value={value}>
                {SOURCE_TYPE_META[value].icon} {SOURCE_TYPE_META[value].label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="btn btn-secondary"
            disabled={busy || title.trim().length === 0}
          >
            + Tambah
          </button>
        </div>
      </form>
    </div>
  );
}
