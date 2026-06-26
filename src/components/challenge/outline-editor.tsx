"use client";

import { useState, type FormEvent } from "react";

import { OutlineItem, type OutlineItemData } from "./outline-item";

const JSON_HEADERS = { "Content-Type": "application/json" };

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
    try {
      const res = await fetch(base, {
        method: "PATCH",
        headers: JSON_HEADERS,
        body: JSON.stringify({ reorder: ordered.map((it) => it.id) }),
      });
      if (!res.ok) {
        setItems(rollback);
        setError("Gagal mengurutkan. Coba lagi.");
      }
    } catch {
      setItems(rollback);
      setError("Kesalahan jaringan saat mengurutkan.");
    }
  }

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(base, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ title }),
      });
      const data: { item?: OutlineItemData; error?: string } = await res.json();
      if (!res.ok || !data.item) {
        setError(data.error ?? "Gagal menambah poin.");
        return;
      }
      const created = data.item;
      setItems((prev) => [...prev, created]);
      setNewTitle("");
    } catch {
      setError("Kesalahan jaringan. Coba lagi.");
    } finally {
      setBusy(false);
    }
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
    try {
      const res = await fetch(base, {
        method: "PATCH",
        headers: JSON_HEADERS,
        body: JSON.stringify({
          id,
          title,
          description: description.length ? description : null,
        }),
      });
      if (!res.ok) {
        setItems(rollback);
        setError("Gagal menyimpan poin.");
      }
    } catch {
      setItems(rollback);
      setError("Kesalahan jaringan. Coba lagi.");
    }
  }

  async function handleDelete(id: string) {
    const rollback = items;
    setError(null);
    setItems((prev) => prev.filter((it) => it.id !== id));
    try {
      const res = await fetch(base, {
        method: "DELETE",
        headers: JSON_HEADERS,
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        setItems(rollback);
        setError("Gagal menghapus poin.");
      }
    } catch {
      setItems(rollback);
      setError("Kesalahan jaringan. Coba lagi.");
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
