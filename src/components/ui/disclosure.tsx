import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { cx } from "@/lib/utils/cx";

interface Props {
  /** Section title, rendered as an h2 in the teacher voice. */
  title: string;
  /** One line that stays readable while closed, so folding hides no verdict. */
  summary?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

/**
 * A sheet that folds (Prompt V.7). For secondary material a learner may want
 * but should not have to scroll past: the full evaluator notes, the
 * comparison with an earlier attempt.
 *
 * Native <details>: works without JavaScript, and keyboard and screen reader
 * behaviour come from the browser rather than from code that can drift.
 */
export function Disclosure({
  title,
  summary,
  children,
  defaultOpen = false,
  className,
}: Props) {
  return (
    <details className={cx("sheet disclosure", className)} open={defaultOpen}>
      <summary className="disclosure-summary">
        <span className="disclosure-text">
          <h2 className="sheet-title">{title}</h2>
          {summary && <span className="disclosure-hint">{summary}</span>}
        </span>
        <ChevronDown className="disclosure-chevron" size={20} aria-hidden="true" />
      </summary>
      <div className="disclosure-body">{children}</div>
    </details>
  );
}
