"use client";

import { useState, type FormEvent } from "react";

import { OkResponseSchema, OutlineItemEnvelopeSchema } from "@/lib/api/contracts";
import { fetchJson } from "@/lib/api/fetch-json";

import { OutlineItem, type OutlineItemData } from "./outline-item";

interface Props {
  challengeId: string;
  initialItems: OutlineItemData[];
}

export function OutlineEditor({ challengeId, initialItems }: Props) {
  const [items, setItems] = useState<OutlineItemData[]>(initialItems);
  const [newTitle, setNewTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const base = `/api/challenge/${challengeId}/outline`;

  function move<T>(list: T[], from: number, to: number): T[] {
    if (to < 0 || to >= list.length) return list;
    const moved = list[from];
    if (moved === undefined) return list;
    const next = [...list];
    next.splice(from, 1);
    next.splice(to, 0, moved);
    return next;
  }

  async function persistOrder(ordered: OutlineItemData[], rollback: OutlineItemData[]) {
    const result = await fetchJson(base, OkResponseSchema, {
      method: "PATCH",
      json: { reorder: ordered.map((it) => it.id) },
    });
    if (!result.ok) {
      setItems(rollback);
      setError(result.error);
    }
  }

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    setBusy(true);
    setError(null);
    const result = await fetchJson(base, OutlineItemEnvelopeSchema, {
      method: "POST",
      json: { title },
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const { id, title: createdTitle, description } = result.data.item;
    setItems((prev) => [...prev, { id, title: createdTitle, description }]);
    setNewTitle("");
  }

  async function handleSave(id: string, title: string, description: string) {
    const rollback = items;
    setError(null);
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? { ...it, title, description: description.length ? description : null }
          : it,
      ),
    );
    const result = await fetchJson(base, OutlineItemEnvelopeSchema, {
      method: "PATCH",
      json: { id, title, description: description.length ? description : null },
    });
    if (!result.ok) {
      setItems(rollback);
      setError(result.error);
    }
  }

  async function handleDelete(id: string) {
    const rollback = items;
    setError(null);
    setItems((prev) => prev.filter((it) => it.id !== id));
    const result = await fetchJson(base, OkResponseSchema, {
      method: "DELETE",
      json: { id },
    });
    if (!result.ok) {
      setItems(rollback);
      setError(result.error);
    }
  }

  function handleMove(index: number, dir: -1 | 1) {
    const rollback = items;
    const next = move(items, index, index + dir);
    if (next === items) return;
    setItems(next);
    void persistOrder(next, rollback);
  }

  function handleDragEnd() {
    if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
      const rollback = items;
      const next = move(items, dragIndex, overIndex);
      if (next !== items) {
        setItems(next);
        void persistOrder(next, rollback);
      }
    }
    setDragIndex(null);
    setOverIndex(null);
  }

  return (
    <div className="stack" style={{ gap: "var(--space-3)" }}>
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-muted text-sm">Belum ada poin outline.</p>
      ) : (
        <ol className="stack" style={{ gap: "var(--space-2)" }}>
          {items.map((item, index) => (
            <OutlineItem
              key={item.id}
              item={item}
              index={index}
              total={items.length}
              disabled={busy}
              dragging={dragIndex === index}
              dropTarget={overIndex === index && dragIndex !== index}
              onSave={handleSave}
              onDelete={handleDelete}
              onMove={handleMove}
              onDragStart={setDragIndex}
              onDragEnter={setOverIndex}
              onDragEnd={handleDragEnd}
            />
          ))}
        </ol>
      )}

      <form className="row" onSubmit={handleAdd} style={{ gap: "var(--space-2)" }}>
        <input
          className="input"
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          placeholder="Tambah poin outline…"
          maxLength={200}
          disabled={busy}
        />
        <button
          type="submit"
          className="btn btn-secondary"
          disabled={busy || newTitle.trim().length === 0}
        >
          + Tambah
        </button>
      </form>
    </div>
  );
}
