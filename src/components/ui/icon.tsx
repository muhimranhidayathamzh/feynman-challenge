import type { LucideIcon } from "lucide-react";

interface IconProps {
  icon: LucideIcon;
  size?: number;
  className?: string;
  /**
   * Accessible name. Omit for decorative icons next to visible text (the
   * default): they are hidden from assistive tech.
   */
  label?: string;
}

/** Consistent wrapper around lucide icons (size, stroke, a11y defaults). */
export function Icon({ icon: Glyph, size = 18, className, label }: IconProps) {
  if (label) {
    return (
      <Glyph
        size={size}
        strokeWidth={2}
        className={className}
        role="img"
        aria-label={label}
      />
    );
  }
  return (
    <Glyph
      size={size}
      strokeWidth={2}
      className={className}
      aria-hidden="true"
      focusable="false"
    />
  );
}
