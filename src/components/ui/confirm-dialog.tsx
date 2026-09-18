"use client";

import type { ReactNode } from "react";

import { Button } from "./button";
import { Dialog } from "./dialog";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
  /** Shows a spinner on the confirm button and blocks closing. */
  busy?: boolean;
  confirmDisabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** Extra content, e.g. a "type HAPUS to confirm" input. */
  children?: ReactNode;
}

/** Accessible replacement for window.confirm. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = "Batal",
  tone = "primary",
  busy = false,
  confirmDisabled = false,
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!busy) onCancel();
      }}
      title={title}
      description={message}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone}
            onClick={onConfirm}
            loading={busy}
            disabled={confirmDisabled}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Dialog>
  );
}
