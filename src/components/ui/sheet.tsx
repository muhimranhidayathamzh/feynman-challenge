import type { HTMLAttributes, ReactNode } from "react";

import { cx } from "@/lib/utils/cx";

interface SheetProps extends HTMLAttributes<HTMLElement> {
  as?: "div" | "section" | "article";
  /** Clickable sheet (a link or button inside covers it): hover firms the edge. */
  interactive?: boolean;
}

/**
 * A sheet of paper: surface colour, hairline edge, no shadow and no blur
 * (DESIGN.md §6). Replaces the old Card.
 */
export function Sheet({
  as: Tag = "div",
  interactive = false,
  className,
  ...rest
}: SheetProps) {
  return (
    <Tag
      className={cx("sheet", interactive && "sheet-interactive", className)}
      {...rest}
    />
  );
}

interface SheetTitleProps {
  /** h2 by default: a sheet is a section of the page. */
  as?: "h2" | "h3";
  id?: string;
  children: ReactNode;
  className?: string;
}

/** Section title in the teacher voice (Newsreader). No decorative icon. */
export function SheetTitle({ as: Tag = "h2", id, children, className }: SheetTitleProps) {
  return (
    <Tag id={id} className={cx("sheet-title", className)}>
      {children}
    </Tag>
  );
}
