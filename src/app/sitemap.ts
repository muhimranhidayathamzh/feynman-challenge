import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site";

/** The public surface. Everything else lives behind sign-in. */
const PUBLIC_PATHS = [
  { path: "/", priority: 1 },
  { path: "/login", priority: 0.5 },
  { path: "/signup", priority: 0.5 },
  { path: "/privasi", priority: 0.3 },
  { path: "/syarat", priority: 0.3 },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const lastModified = new Date();

  return PUBLIC_PATHS.map(({ path, priority }) => ({
    url: `${base}${path}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority,
  }));
}
