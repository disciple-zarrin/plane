/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { initPromise } from "@plane/i18n";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

import polyfills from "@/lib/polyfills";
import { isStaleAssetErrorMessage, recoverFromStaleAsset } from "@/lib/stale-asset-error";

void polyfills;

if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  const syncAlarms = () => {
    void import("@/services/web-push.service").then(async (m) => {
      await m.syncPendingAlarmsFromServer();
      await m.flushLocalAlarms();
    });
  };

  window.addEventListener("load", () => {
    void navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then(() => {
        syncAlarms();
      })
      .catch(() => {
        /* ignore */
      });
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") syncAlarms();
  });
  window.addEventListener("online", () => {
    syncAlarms();
  });
}

// Production-only: in dev these errors come from the dev server itself (restarts,
// stale optimized deps) and auto-reloading would mask them.
if (import.meta.env.PROD) {
  window.addEventListener("vite:preloadError", (event) => {
    if (recoverFromStaleAsset()) event.preventDefault();
  });

  window.addEventListener("error", (event) => {
    if (isStaleAssetErrorMessage(event.message || "")) recoverFromStaleAsset();
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason instanceof Error ? event.reason.message : String(event.reason ?? "");
    if (isStaleAssetErrorMessage(reason)) recoverFromStaleAsset();
  });
}

// Initialize i18n before hydrating (the remix-i18next pattern for React
// Router: await init, then hydrateRoot). Hydrating before the instance is
// ready would make the first client render diverge from the prerendered
// shell, and React 19 leaves DOM it could not adopt in place instead of
// clearing it.
void initPromise
  .catch(() => {})
  .then(() => {
    startTransition(() => {
      hydrateRoot(
        document,
        <StrictMode>
          <HydratedRouter />
        </StrictMode>
      );
    });
  });
