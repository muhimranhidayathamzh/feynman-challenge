"use client";

import { useEffect } from "react";

import { useToast } from "@/components/ui/toast";
import { SW_URL, postToWorker } from "@/lib/pwa/client";

const UPDATE_CHECK_MS = 60 * 60 * 1000;

/**
 * Registers the service worker in production and announces updates: when a
 * new build's worker is waiting, a toast offers to reload into it. Must be
 * rendered inside ToastProvider. Renders nothing.
 */
export function PwaRegister() {
  const { show } = useToast();

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) {
      return;
    }
    const sw = navigator.serviceWorker;
    let cancelled = false;
    let reloadRequested = false;
    let announced = false;
    let lastCheck = Date.now();
    let registration: ServiceWorkerRegistration | null = null;

    function announce(waiting: ServiceWorker) {
      if (announced || cancelled) return;
      announced = true;
      show({
        message: "Versi baru tersedia.",
        tone: "info",
        durationMs: 0,
        action: {
          label: "Muat ulang",
          onClick: () => {
            reloadRequested = true;
            postToWorker(waiting, { type: "SKIP_WAITING" });
          },
        },
      });
    }

    function watch(reg: ServiceWorkerRegistration) {
      // A worker is "waiting" only when an older one controls the page, so the
      // very first install never triggers the toast.
      if (reg.waiting && sw.controller) announce(reg.waiting);
      reg.addEventListener("updatefound", () => {
        const installing = reg.installing;
        installing?.addEventListener("statechange", () => {
          if (installing.state === "installed" && sw.controller) announce(installing);
        });
      });
    }

    // Reload once the new worker takes over, but only if the learner asked.
    function onControllerChange() {
      if (!reloadRequested) return;
      reloadRequested = false;
      window.location.reload();
    }

    // Long-lived installed apps: look for a new build when brought back.
    function onVisible() {
      if (document.visibilityState !== "visible" || !registration) return;
      if (Date.now() - lastCheck < UPDATE_CHECK_MS) return;
      lastCheck = Date.now();
      registration.update().catch(() => undefined);
    }

    function register() {
      sw.register(SW_URL, { scope: "/", updateViaCache: "none" })
        .then((reg) => {
          if (cancelled) return;
          registration = reg;
          watch(reg);
        })
        .catch(() => undefined);
    }

    sw.addEventListener("controllerchange", onControllerChange);
    document.addEventListener("visibilitychange", onVisible);
    // The load event may have fired before hydration.
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => {
      cancelled = true;
      sw.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("load", register);
    };
  }, [show]);

  return null;
}
