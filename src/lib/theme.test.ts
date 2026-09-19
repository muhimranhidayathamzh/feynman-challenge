import { describe, expect, it } from "vitest";

import { parseTheme, themeColorFor, themeCookie } from "./theme";

describe("theme preference", () => {
  it("accepts the three known values and defaults to system", () => {
    expect(parseTheme("light")).toBe("light");
    expect(parseTheme("dark")).toBe("dark");
    expect(parseTheme("system")).toBe("system");
    expect(parseTheme(undefined)).toBe("system");
    expect(parseTheme("purple")).toBe("system");
  });

  it("writes a year-long, site-wide cookie", () => {
    expect(themeCookie("dark")).toBe(
      "theme=dark; Path=/; Max-Age=31536000; SameSite=Lax",
    );
  });

  it("gives one theme colour for a fixed theme and two for system", () => {
    expect(themeColorFor("light")).toBe("#f4efe4");
    expect(themeColorFor("system")).toHaveLength(2);
  });
});
