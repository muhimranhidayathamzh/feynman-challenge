import type { ReactNode, Ref } from "react";

import { cx } from "@/lib/utils/cx";

import { Illustration, type IllustrationName } from "./illustration";

interface Props {
  illustration: IllustrationName;
  title: string;
  /** h1 when the empty state is the whole page (offline, 404). */
  headingLevel?: "h1" | "h2";
  headingRef?: Ref<HTMLHeadingElement>;
  children?: ReactNode;
  /** Buttons or links. */
  actions?: ReactNode;
  className?: string;
}

/**
 * A human empty or error screen (DESIGN.md §10): a line illustration, one
 * sentence of title, a short explanation, and at most a couple of actions.
 */
export function EmptyState({
  illustration,
  title,
  headingLevel: Heading = "h2",
  headingRef,
  children,
  actions,
  className,
}: Props) {
  return (
    <div className={cx("empty-state", className)}>
      <Illustration name={illustration} />
      <Heading
        ref={headingRef}
        tabIndex={headingRef ? -1 : undefined}
        className="empty-state-title focus-target"
      >
        {title}
      </Heading>
      {children && <div className="empty-state-body">{children}</div>}
      {actions && <div className="empty-state-actions">{actions}</div>}
    </div>
  );
}
