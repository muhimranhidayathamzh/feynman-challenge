/**
 * The canonical origin of this deployment.
 *
 * Needed by anything that has to produce an absolute URL from the server:
 * Open Graph tags, `robots.txt`, and the sitemap. Next.js resolves relative
 * metadata URLs against `metadataBase`, so getting this wrong means link
 * previews point at localhost.
 */

const DEFAULT_ORIGIN = "http://localhost:3000";

export interface SiteUrlSources {
  /** Set this by hand once a custom domain exists. Wins over everything. */
  siteUrl?: string;
  /** Vercel: the stable production domain, on every deployment. */
  vercelProductionUrl?: string;
  /** Vercel: the per-deployment URL (preview builds). */
  vercelUrl?: string;
}

/**
 * Picks the best origin available and normalises it: scheme added when a bare
 * host is given (Vercel supplies hosts without one), no trailing slash, no
 * path. Returns the localhost default when nothing usable is set, so a local
 * `next build` never fails on a missing variable.
 */
export function resolveSiteUrl(sources: SiteUrlSources): string {
  const candidates = [sources.siteUrl, sources.vercelProductionUrl, sources.vercelUrl];

  for (const candidate of candidates) {
    const normalised = normaliseOrigin(candidate);
    if (normalised) return normalised;
  }
  return DEFAULT_ORIGIN;
}

function normaliseOrigin(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  // Vercel gives "my-app.vercel.app", the URL parser needs a scheme. Only a
  // value with no scheme at all may be assumed https: prepending it to
  // "ftp://host" would otherwise parse as the bogus origin "https://ftp".
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed);
  const withScheme = hasScheme ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname) return null;
    return url.origin;
  } catch {
    return null;
  }
}

/**
 * Whether search engines may index this deployment.
 *
 * Default is NO. A test deployment on a vercel.app URL that gets indexed is
 * painful to undo — removal from a search index takes far longer than the
 * mistake takes to make — so indexing is opt-in, switched on deliberately when
 * the real launch happens.
 */
export function indexingAllowed(): boolean {
  const value = process.env.NEXT_PUBLIC_ALLOW_INDEXING?.trim().toLowerCase();
  return value === "1" || value === "true";
}

/**
 * The origin for this process. Read with static `process.env.X` accesses so
 * Next.js can inline the public one into the client bundle.
 */
export function siteUrl(): string {
  return resolveSiteUrl({
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    vercelProductionUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    vercelUrl: process.env.VERCEL_URL,
  });
}
