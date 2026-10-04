/**
 * Checking the links the AI suggests (sources, A): the AI may give a URL
 * whenever it believes it knows one; the server opens each link briefly and
 * keeps only those that answer. A dead link costs nothing but a search
 * fallback (utils/source-link.ts).
 *
 * The URLs come from model output, which a topic can steer, so only public
 * https addresses are ever requested: no IP literals, no local or internal
 * names, and redirects are not followed (a redirect already proves the page
 * exists).
 */

export type LinkVerdict = "alive" | "dead" | "unknown";

const PRIVATE_HOST = /^(localhost|.*\.local|.*\.internal|.*\.localhost)$/i;
const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;

/** True when the server may request this URL at all. */
export function isCheckableUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  if (url.username || url.password) return false;
  if (url.port && url.port !== "443") return false;
  const host = url.hostname;
  // IP literals (v4, or v6 in brackets) and single-label names are never public pages.
  if (IPV4.test(host) || host.includes(":") || host.startsWith("[")) return false;
  if (!host.includes(".") || PRIVATE_HOST.test(host)) return false;
  return true;
}

/**
 * 2xx and 3xx: the page exists. 404 and 410: it does not. Anything else
 * (403 from bot protection, 429, 5xx) proves nothing either way.
 */
export function verdictForStatus(status: number): LinkVerdict {
  if (status >= 200 && status < 400) return "alive";
  if (status === 404 || status === 410) return "dead";
  return "unknown";
}

/**
 * YouTube answers 200 even for a video that does not exist, so a video link
 * is checked through its oEmbed endpoint, which answers 404 for those.
 */
export function youtubeOembedUrl(value: string): string | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\.|^m\./, "");
  const isVideo =
    (host === "youtube.com" &&
      (url.pathname === "/watch" || url.pathname.startsWith("/shorts/"))) ||
    host === "youtu.be";
  if (!isVideo) return null;
  return `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(value)}`;
}

/**
 * What to keep: alive links, and unknown ones (a site blocking bots is still
 * a real page). Only links shown to be dead, or never checkable, are dropped.
 */
export function keepLink(verdict: LinkVerdict): boolean {
  return verdict !== "dead";
}
