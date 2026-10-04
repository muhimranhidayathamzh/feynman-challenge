import "server-only";

import {
  isCheckableUrl,
  keepLink,
  verdictForStatus,
  youtubeOembedUrl,
  type LinkVerdict,
} from "@/lib/utils/link-check";

/** Per link; every link is checked at once, so this bounds the whole step. */
const CHECK_TIMEOUT_MS = 2500;

async function status(url: string, method: "HEAD" | "GET"): Promise<number> {
  const response = await fetch(url, {
    method,
    redirect: "manual",
    signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
    headers: { "User-Agent": "FeynmanChallenge-LinkCheck/1.0" },
  });
  // Only the status matters: never read a body.
  await response.body?.cancel().catch(() => undefined);
  return response.status;
}

/** Whether a suggested link leads to a page. Never throws. */
export async function checkLink(url: string): Promise<LinkVerdict> {
  if (!isCheckableUrl(url)) return "dead";
  const target = youtubeOembedUrl(url) ?? url;
  try {
    let code = await status(target, "HEAD");
    // Some servers refuse HEAD; ask again the ordinary way.
    if (code === 405 || code === 501) code = await status(target, "GET");
    return verdictForStatus(code);
  } catch (error) {
    // Slow is not missing. A name that does not resolve, or a refused
    // connection, is.
    const name = error instanceof Error ? error.name : "";
    return name === "TimeoutError" || name === "AbortError" ? "unknown" : "dead";
  }
}

/**
 * The AI's suggested sources with every dead link removed (the title then
 * opens a search instead, see utils/source-link.ts).
 */
export async function verifySourceLinks<T extends { url: string | null }>(
  sources: readonly T[],
): Promise<T[]> {
  return Promise.all(
    sources.map(async (source) => {
      if (!source.url) return source;
      const verdict = await checkLink(source.url);
      return keepLink(verdict) ? source : { ...source, url: null };
    }),
  );
}
