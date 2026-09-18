import type { HTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";

import { cx } from "@/lib/utils/cx";

import { Icon } from "./icon";

export type BadgeTone = "neutral" | "success" | "warning" | "error" | "accent";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  icon?: LucideIcon;
}

export function Badge({
  tone = "neutral",
  icon,
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cx("badge", tone !== "neutral" && `badge-${tone}`, className)}
      {...rest}
    >
      {icon ? <Icon icon={icon} size={12} /> : null}
      {children}
    </span>
  );
}
