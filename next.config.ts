import type { NextConfig } from "next";

// Identifies this build. The service worker is registered as /sw.js?v=<this>,
// so every deploy installs a fresh worker with its own versioned caches.
// Stored in process.env (not a local const) so build workers spawned after
// this file loads inherit the SAME value. NEXT_PUBLIC_* is inlined for the
// client automatically.
process.env.NEXT_PUBLIC_APP_VERSION ??=
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? Date.now().toString(36);

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Always revalidate the worker script so updates are picked up.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
      {
        source: "/manifest.json",
        headers: [{ key: "Content-Type", value: "application/manifest+json" }],
      },
    ];
  },
};

export default nextConfig;
