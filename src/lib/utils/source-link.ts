import type { SourceType } from "@/types";

/**
 * Where a source's title should lead (V.11).
 *
 * The AI is told never to invent a URL (src/lib/gemini/prompts.ts), so most
 * suggested sources arrive without one. A title nobody can open looks like a
 * bug, so every title links somewhere: to its own page when it has a real
 * http(s) URL, otherwise to a search for that title on the place where that
 * kind of source lives. The label says which, so a search is never passed
 * off as the page itself.
 */
export interface SourceLink {
  href: string;
  /** "direct": the source's own page. "search": a search for its title. */
  kind: "direct" | "search";
  /** Shown after the type: the site's host, or "cari di YouTube". */
  label: string;
}

const SEARCH: Record<SourceType, { base: string; param: string; label: string }> = {
  video: {
    base: "https://www.youtube.com/results",
    param: "search_query",
    label: "cari di YouTube",
  },
  paper: {
    base: "https://scholar.google.com/scholar",
    param: "q",
    label: "cari di Google Scholar",
  },
  article: { base: "https://www.google.com/search", param: "q", label: "cari di Google" },
  book: { base: "https://www.google.com/search", param: "q", label: "cari di Google" },
  other: { base: "https://www.google.com/search", param: "q", label: "cari di Google" },
};

/** The host without "www.", or null when the URL is not a usable http(s) link. */
export function siteName(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.hostname.replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}

export function sourceLink(source: {
  title: string;
  url: string | null;
  type: SourceType;
}): SourceLink {
  const site = source.url ? siteName(source.url) : null;
  if (source.url && site) {
    return { href: source.url, kind: "direct", label: site };
  }
  const search = SEARCH[source.type] ?? SEARCH.other;
  const params = new URLSearchParams({ [search.param]: source.title.trim() });
  return {
    href: `${search.base}?${params.toString()}`,
    kind: "search",
    label: search.label,
  };
}
