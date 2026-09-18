import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { LoaderCircle, type LucideIcon } from "lucide-react";

import { cx } from "@/lib/utils/cx";

import { Icon } from "./icon";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

interface StyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  /** Leading icon (decorative; the text is the label). */
  icon?: LucideIcon;
}

const ICON_SIZE: Record<ButtonSize, number> = { sm: 14, md: 16, lg: 18 };

export function buttonClassName({
  variant = "primary",
  size = "md",
  block = false,
  className,
}: StyleProps & { className?: string | undefined }): string {
  return cx(
    "btn",
    `btn-${variant}`,
    size !== "md" && `btn-${size}`,
    block && "btn-block",
    className,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, StyleProps {
  /** Shows a spinner, disables the button, and sets aria-busy. */
  loading?: boolean;
  children?: ReactNode;
}

export function Button({
  variant,
  size = "md",
  block,
  icon,
  loading = false,
  disabled,
  className,
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClassName({ variant, size, block, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <Icon icon={LoaderCircle} size={ICON_SIZE[size]} className="animate-spin" />
      ) : icon ? (
        <Icon icon={icon} size={ICON_SIZE[size]} />
      ) : null}
      {children}
    </button>
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & StyleProps;

/** A Next.js link styled as a button. */
export function ButtonLink({
  variant,
  size = "md",
  block,
  icon,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link className={buttonClassName({ variant, size, block, className })} {...rest}>
      {icon ? <Icon icon={icon} size={ICON_SIZE[size]} /> : null}
      {children}
    </Link>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  /** Required: an icon-only button needs an accessible name. */
  label: string;
  danger?: boolean;
}

/** Square icon-only button (toolbar actions). */
export function IconButton({
  icon,
  label,
  danger = false,
  className,
  type = "button",
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={cx("icon-btn", className)}
      data-danger={danger || undefined}
      aria-label={label}
      title={label}
      {...rest}
    >
      <Icon icon={icon} size={16} />
    </button>
  );
}
