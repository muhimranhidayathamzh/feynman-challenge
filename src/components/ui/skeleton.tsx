import type { CSSProperties } from "react";

interface Props {
  width?: string;
  height?: string;
  radius?: string;
  className?: string;
  style?: CSSProperties;
}

/** A shimmering placeholder block (uses the `.skeleton` design-system class). */
export function Skeleton({ width, height, radius, className, style }: Props) {
  return (
    <div
      className={`skeleton${className ? ` ${className}` : ""}`}
      aria-hidden="true"
      style={{
        width: width ?? "100%",
        height: height ?? "1rem",
        borderRadius: radius,
        ...style,
      }}
    />
  );
}
