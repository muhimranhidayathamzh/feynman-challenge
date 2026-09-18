"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";

import { cx } from "@/lib/utils/cx";

import { Icon } from "./icon";

export type ToastTone = "info" | "success" | "error";

export interface ToastOptions {
  message: string;
  tone?: ToastTone;
  /** Milliseconds before auto-dismiss; 0 keeps it until dismissed. */
  durationMs?: number;
  action?: { label: string; onClick: () => void };
}

interface ToastItem extends Required<Pick<ToastOptions, "message" | "tone">> {
  id: number;
  durationMs: number;
  action: ToastOptions["action"];
}

interface ToastContextValue {
  show: (options: ToastOptions) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_ICON = { info: Info, success: CircleCheck, error: CircleAlert } as const;
const DEFAULT_DURATION_MS = 4000;

/**
 * App-wide toast queue. Rendered in a polite live region so screen readers
 * announce messages without stealing focus.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const show = useCallback(
    (options: ToastOptions) => {
      const id = nextId.current++;
      const item: ToastItem = {
        id,
        message: options.message,
        tone: options.tone ?? "info",
        durationMs: options.durationMs ?? DEFAULT_DURATION_MS,
        action: options.action,
      };
      setItems((prev) => [...prev.slice(-2), item]); // keep at most 3
      if (item.durationMs > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), item.durationMs),
        );
      }
      return id;
    },
    [dismiss],
  );

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => clearTimeout(timer));
  }, []);

  const value = useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" aria-live="polite" aria-atomic="false">
        {items.map((item) => (
          <div key={item.id} className={cx("toast", `toast-${item.tone}`)} role="status">
            <Icon icon={TONE_ICON[item.tone]} size={18} className="toast-icon" />
            <span className="toast-message">{item.message}</span>
            {item.action ? (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  item.action?.onClick();
                  dismiss(item.id);
                }}
              >
                {item.action.label}
              </button>
            ) : null}
            <button
              type="button"
              className="icon-btn"
              onClick={() => dismiss(item.id)}
              aria-label="Tutup notifikasi"
            >
              <Icon icon={X} size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
}
