/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

import polyfills from "@/lib/polyfills";

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

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>
  );
});
