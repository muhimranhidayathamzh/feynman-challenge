"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Check, Pencil, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { SheetTitle } from "@/components/ui/sheet";
import { OkResponseSchema, OutlineItemEnvelopeSchema } from "@/lib/api/contracts";
import { fetchJson } from "@/lib/api/fetch-json";
import { outlineAnchorId, type TrendPoint } from "@/lib/utils/coverage-progress";

import { CoverageTrendLegend } from "./coverage-trend";

import { OutlineItem, type OutlineItemData } from "./outline-item";

interface Props {
  challengeId: string;
  initialItems: OutlineItemData[];
  /** Coverage trend per outline item id (items never assessed are absent). */
  trend: Record<string, TrendPoint[]>;
}

const HIGHLIGHT_MS = 4000;
const ANCHOR_PREFIX = `#${outlineAnchorId("")}`;

export function OutlineEditor({ challengeId, initialItems, trend }: Props) {
  const [items, setItems] = useState<OutlineItemData[]>(initialItems);
  const [newTitle, setNewTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  // Reading mode by default; an empty outline starts in edit mode.
  const [editMode, setEditMode] = useState(initialItems.length === 0);

  // Arriving from "Pelajari lagi" (#outline-<id>): bring that point into view,
  // move focus to it, and highlight it for a moment.
  useEffect(() => {
    function reveal() {
      const { hash } = window.location;
      if (!hash.startsWith(ANCHOR_PREFIX)) return;
      const id = decodeURIComponent(hash.slice(ANCHOR_PREFIX.length));
      const element = document.getElementById(outlineAnchorId(id));
      if (!element) return;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      element.scrollIntoView({
        block: "center",
        behavior: reduceMotion ? "auto" : "smooth",
      });
      element.focus({ preventScroll: true });
      setHighlightId(id);
    }
    reveal();
    window.addEventListener("hashchange", reveal);
    return () => window.removeEventListener("hashchange", reveal);
  }, []);

  useEffect(() => {
    if (!highlightId) return;
    const timer = setTimeout(() => setHighlightId(null), HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [highlightId]);

  const hasTrend = items.some((item) => trend[item.id] !== undefined);

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
    <div className="stack gap-4">
      <div className="row-between items-start gap-3">
        <div className="stack gap-1">
          <SheetTitle>Poin yang perlu kamu jelaskan</SheetTitle>
          <p className="text-secondary text-sm">
            Setiap poin dinilai. Ini juga bahan belajarmu.
          </p>
        </div>
        {items.length > 0 && (
          <Button
            variant={editMode ? "secondary" : "ghost"}
            size="sm"
            icon={editMode ? Check : Pencil}
            onClick={() => setEditMode((value) => !value)}
            aria-pressed={editMode}
          >
            {editMode ? "Selesai" : "Ubah"}
          </Button>
        )}
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {hasTrend && !editMode && <CoverageTrendLegend />}

      {items.length === 0 ? (
        <p className="text-muted text-sm">
          Belum ada poin. Tambahkan poin pertama di bawah.
        </p>
      ) : (
        <ol className="outline-list">
          {items.map((item, index) => (
            <OutlineItem
              key={item.id}
              item={item}
              index={index}
              total={items.length}
              editMode={editMode}
              disabled={busy}
              dragging={dragIndex === index}
              dropTarget={overIndex === index && dragIndex !== index}
              highlighted={highlightId === item.id}
              trend={trend[item.id]}
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

      {editMode && (
        <form className="row gap-2" onSubmit={handleAdd}>
          <Input
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            placeholder="Tambah poin outline…"
            maxLength={200}
            disabled={busy}
            aria-label="Poin outline baru"
          />
          <Button
            type="submit"
            variant="secondary"
            icon={Plus}
            disabled={busy || newTitle.trim().length === 0}
          >
            Tambah
          </Button>
        </form>
      )}
    </div>
  );
}
