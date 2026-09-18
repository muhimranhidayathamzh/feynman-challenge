/** Joins truthy class names: cx("btn", active && "is-active", undefined) -> "btn is-active". */
export function cx(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(" ");
}
