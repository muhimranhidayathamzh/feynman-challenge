"use client";

import { useEffect, useId, useRef, type MouseEvent, type ReactNode } from "react";

interface DialogProps {
  open: boolean;
  /** Called on Escape, backdrop click, or any other request to close. */
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
}

/**
 * Modal built on the native <dialog> element: the browser provides the focus
 * trap, inert background, and Escape handling. We add backdrop-click close
 * and return focus to whatever was focused before opening.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnFocus.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const handleClose = () => {
      returnFocus.current?.focus();
      returnFocus.current = null;
      if (open) onClose(); // closed natively (Escape): tell the parent
    };
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [open, onClose]);

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    // Clicks on the ::backdrop target the <dialog> itself, not its content.
    if (event.target === event.currentTarget) onClose();
  }

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClick={handleBackdropClick}
    >
      <div className="dialog-body">
        <h2 id={titleId} className="dialog-title">
          {title}
        </h2>
        {description ? (
          <div id={descriptionId} className="text-secondary">
            {description}
          </div>
        ) : null}
        {children}
        {footer ? <div className="dialog-footer">{footer}</div> : null}
      </div>
    </dialog>
  );
}
