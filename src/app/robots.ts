import type { MetadataRoute } from "next";

import { indexingAllowed, siteUrl } from "@/lib/site";

/**
 * Indexing is opt-in (NEXT_PUBLIC_ALLOW_INDEXING), so a test deployment is
 * never crawled by accident. Once it is on, only the pages a signed-out
 * visitor can actually see are crawlable; everything else either needs a
 * session or is an API route, and is disallowed explicitly.
 */
export default function robots(): MetadataRoute.Robots {
  if (!indexingAllowed()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dev/", "/challenge/", "/pengaturan", "/offline"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
