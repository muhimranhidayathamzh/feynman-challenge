import {
  cloneElement,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

import { cx } from "@/lib/utils/cx";

type ControlProps = {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

interface FieldProps {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  optional?: boolean;
  /** Exactly one control (Input / Textarea / Select). Gets id + aria wiring. */
  children: ReactElement<ControlProps>;
  className?: string;
}

/**
 * Label + control + hint + error, with the accessibility wiring done once:
 * the control receives `id`, `aria-describedby` (hint and error), and
 * `aria-invalid` when there is an error.
 */
export function Field({
  id,
  label,
  hint,
  error,
  optional = false,
  children,
  className,
}: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cx("field", className)}>
      <label className="label" htmlFor={id}>
        {label}
        {optional ? <span className="text-muted"> (opsional)</span> : null}
      </label>
      {cloneElement(children, {
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
      })}
      {hint ? (
        <span id={hintId} className="field-hint">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={errorId} className="field-error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx("input", className)} {...rest} />;
}

export function Textarea({
  className,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx("textarea", className)} {...rest} />;
}

export function Select({ className, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cx("input", "select", className)} {...rest} />;
}
