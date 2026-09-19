// ============================================================================
// Theme preference (DESIGN.md §2, decision DV2). Stored in a cookie so the
// server renders <html data-theme> correctly on the first paint. Pure and
// client-safe.
// ============================================================================

export const THEME_COOKIE = "theme";

export const THEME_PREFERENCES = ["system", "light", "dark"] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];

export const THEME_LABELS: Record<ThemePreference, string> = {
  system: "Ikuti sistem",
  light: "Terang",
  dark: "Gelap",
};

/** Page background per palette, for <meta name="theme-color">. */
export const THEME_COLORS = { light: "#f4efe4", dark: "#141b19" } as const;

const ONE_YEAR_SEC = 60 * 60 * 24 * 365;

export function parseTheme(value: string | null | undefined): ThemePreference {
  return THEME_PREFERENCES.find((theme) => theme === value) ?? "system";
}

/** Value for document.cookie. */
export function themeCookie(theme: ThemePreference): string {
  return `${THEME_COOKIE}=${theme}; Path=/; Max-Age=${ONE_YEAR_SEC}; SameSite=Lax`;
}

/** theme-color entries: one fixed colour, or one per system scheme. */
export function themeColorFor(
  theme: ThemePreference,
): string | { media: string; color: string }[] {
  if (theme !== "system") return THEME_COLORS[theme];
  return [
    { media: "(prefers-color-scheme: light)", color: THEME_COLORS.light },
    { media: "(prefers-color-scheme: dark)", color: THEME_COLORS.dark },
  ];
}
