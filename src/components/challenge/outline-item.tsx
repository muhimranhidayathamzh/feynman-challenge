"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Check, GripVertical, Pencil, Trash2 } from "lucide-react";

import { Button, IconButton } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { outlineAnchorId, type TrendPoint } from "@/lib/utils/coverage-progress";

import { CoverageTrend } from "./coverage-trend";

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
  /** Briefly highlighted after arriving via "Pelajari lagi". */
  highlighted: boolean;
  /** Coverage of this point in the last attempts (oldest first). */
  trend: TrendPoint[] | undefined;
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
  highlighted,
  trend,
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

  const className = `editor-row focus-target${dragging ? " dragging" : ""}${
    dropTarget ? " drop-target" : ""
  }${highlighted ? " is-highlighted" : ""}`;

  return (
    <li
      id={outlineAnchorId(item.id)}
      tabIndex={-1}
      className={className}
      draggable={!editing && !disabled}
      onDragStart={() => onDragStart(index)}
      onDragEnter={() => onDragEnter(index)}
      onDragOver={(event) => event.preventDefault()}
      onDragEnd={onDragEnd}
    >
      <span className="drag-handle" title="Seret untuk mengurutkan">
        <Icon icon={GripVertical} size={16} />
      </span>
      <span className="badge" aria-hidden="true">
        {index + 1}
      </span>

      {editing ? (
        <div className="stack flex-1 gap-2">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={200}
            aria-label="Judul poin"
            autoFocus
          />
          <Textarea
            className="textarea-compact"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Deskripsi (opsional)"
            maxLength={1000}
            aria-label="Deskripsi poin"
          />
          <div className="row gap-2">
            <Button
              size="sm"
              icon={Check}
              onClick={handleSave}
              disabled={title.trim().length === 0}
            >
              Simpan
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
              Batal
            </Button>
          </div>
        </div>
      ) : (
        <div className="stack flex-1 gap-1">
          <span className="font-semibold">{item.title}</span>
          {item.description && (
            <span className="text-secondary text-sm">{item.description}</span>
          )}
          {trend && <CoverageTrend points={trend} />}
        </div>
      )}

      {!editing && (
        <div className="row gap-0">
          <IconButton
            icon={ArrowUp}
            label={`Pindahkan "${item.title}" ke atas`}
            onClick={() => onMove(index, -1)}
            disabled={disabled || index === 0}
          />
          <IconButton
            icon={ArrowDown}
            label={`Pindahkan "${item.title}" ke bawah`}
            onClick={() => onMove(index, 1)}
            disabled={disabled || index === total - 1}
          />
          <IconButton
            icon={Pencil}
            label={`Edit "${item.title}"`}
            onClick={startEdit}
            disabled={disabled}
          />
          <IconButton
            icon={Trash2}
            label={`Hapus "${item.title}"`}
            danger
            onClick={() => onDelete(item.id)}
            disabled={disabled}
          />
        </div>
      )}
    </li>
  );
}
