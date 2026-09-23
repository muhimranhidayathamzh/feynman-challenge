import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site";

/**
 * Only the pages a signed-out visitor can actually see are worth crawling.
 * Everything else either needs a session (and would serve a redirect to a
 * crawler) or is an API route, so it is disallowed explicitly rather than
 * left to chance.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dev/", "/challenge/", "/pengaturan", "/offline"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
