import type { HTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cx } from "@/lib/utils/cx";

import { Icon } from "./icon";

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: "div" | "section" | "article";
  variant?: "card" | "glass";
  /** Lift + glow on hover (for clickable cards). */
  hover?: boolean;
}

export function Card({
  as: Tag = "div",
  variant = "card",
  hover = false,
  className,
  ...rest
}: CardProps) {
  return <Tag className={cx(variant, hover && "card-hover", className)} {...rest} />;
}

interface CardTitleProps {
  icon?: LucideIcon;
  as?: "h2" | "h3";
  children: ReactNode;
  className?: string;
}

/** Card heading with an optional decorative icon. */
export function CardTitle({ icon, as: Tag = "h3", children, className }: CardTitleProps) {
  return (
    <Tag className={cx("card-title", className)}>
      {icon ? <Icon icon={icon} size={20} className="card-title-icon" /> : null}
      {children}
    </Tag>
  );
}
