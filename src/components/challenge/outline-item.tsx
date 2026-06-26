"use client";

import { useState } from "react";

export interface OutlineItemData {
  id: string;
  title: string;
  description: string | null;
}

interface Props {
  item: OutlineItemData;
  index: number;
  total: number;
  disabled: boolean;
  dragging: boolean;
  dropTarget: boolean;
  onSave: (id: string, title: string, description: string) => void;
  onDelete: (id: string) => void;
  onMove: (index: number, dir: -1 | 1) => void;
  onDragStart: (index: number) => void;
  onDragEnter: (index: number) => void;
  onDragEnd: () => void;
}

export function OutlineItem({
  item,
  index,
  total,
  disabled,
  dragging,
  dropTarget,
  onSave,
  onDelete,
  onMove,
  onDragStart,
  onDragEnter,
  onDragEnd,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description ?? "");

  function startEdit() {
    setTitle(item.title);
    setDescription(item.description ?? "");
    setEditing(true);
  }

  function handleSave() {
    const trimmed = title.trim();
    if (!trimmed) return;
    onSave(item.id, trimmed, description.trim());
    setEditing(false);
  }

  const className = `editor-row${dragging ? " dragging" : ""}${
    dropTarget ? " drop-target" : ""
  }`;

  return (
    <li
      className={className}
      draggable={!editing && !disabled}
      onDragStart={() => onDragStart(index)}
      onDragEnter={() => onDragEnter(index)}
      onDragOver={(event) => event.preventDefault()}
      onDragEnd={onDragEnd}
    >
      <span
        className="drag-handle"
        aria-hidden="true"
        title="Seret untuk mengurutkan"
        style={{ paddingTop: "0.15rem" }}
      >
        ⠿
      </span>
      <span className="badge" aria-hidden="true">
        {index + 1}
      </span>

      {editing ? (
        <div className="stack" style={{ flex: 1, gap: "var(--space-2)" }}>
          <input
            className="input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={200}
            aria-label="Judul poin"
            autoFocus
          />
          <textarea
            className="textarea"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Deskripsi (opsional)"
            maxLength={1000}
            style={{ minHeight: "4rem" }}
            aria-label="Deskripsi poin"
          />
          <div className="row" style={{ gap: "var(--space-2)" }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleSave}
              disabled={title.trim().length === 0}
            >
              Simpan
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setEditing(false)}
            >
              Batal
            </button>
          </div>
        </div>
      ) : (
        <div className="stack" style={{ flex: 1, gap: "var(--space-1)" }}>
          <span className="font-semibold">{item.title}</span>
          {item.description && (
            <span className="text-secondary text-sm">{item.description}</span>
          )}
        </div>
      )}

      {!editing && (
        <div className="row" style={{ gap: 0 }}>
          <button
            type="button"
            className="icon-btn"
            onClick={() => onMove(index, -1)}
            disabled={disabled || index === 0}
            aria-label="Pindah ke atas"
            title="Naik"
          >
            ↑
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => onMove(index, 1)}
            disabled={disabled || index === total - 1}
            aria-label="Pindah ke bawah"
            title="Turun"
          >
            ↓
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={startEdit}
            disabled={disabled}
            aria-label="Edit poin"
            title="Edit"
          >
            ✏️
          </button>
          <button
            type="button"
            className="icon-btn"
            data-danger="true"
            onClick={() => onDelete(item.id)}
            disabled={disabled}
            aria-label="Hapus poin"
            title="Hapus"
          >
            🗑️
          </button>
        </div>
      )}
    </li>
  );
}
