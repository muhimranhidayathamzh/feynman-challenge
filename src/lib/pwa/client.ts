// ============================================================================
// Browser-side helpers for the service worker (public/sw.js).
// ============================================================================

export const SW_URL = `/sw.js?v=${encodeURIComponent(
  process.env.NEXT_PUBLIC_APP_VERSION ?? "dev",
)}`;

export type SwMessage = { type: "SKIP_WAITING" } | { type: "CLEAR_CACHES" };

export function postToWorker(
  worker: ServiceWorker | null | undefined,
  message: SwMessage,
) {
  worker?.postMessage(message);
}

/**
 * Wipes every Cache Storage entry after logout. The worker never caches page
 * HTML, but this also removes anything an older worker stored. When a worker
 * controls the page it does the wipe (and re-precaches the user-free offline
 * page); otherwise the page deletes the caches itself.
 */
export async function clearAppCaches(): Promise<void> {
  if (typeof window === "undefined") return;
  const controller =
    "serviceWorker" in navigator ? navigator.serviceWorker.controller : null;
  if (controller) {
    postToWorker(controller, { type: "CLEAR_CACHES" });
    return;
  }
  if (!("caches" in window)) return;
  try {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  } catch {
    // Cache Storage can be unavailable (private mode); nothing to clear then.
  }
}
