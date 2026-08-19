/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import { syncPendingAlarmsFromServer, flushLocalAlarms } from "@/services/web-push.service";

import polyfills from "@/lib/polyfills";

void polyfills;

if (typeof window !== "undefined") {
  (window as any).syncPendingAlarmsFromServer = syncPendingAlarmsFromServer;

  const syncAlarms = () => {
    void syncPendingAlarmsFromServer();
    void flushLocalAlarms();
  };

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then(() => syncAlarms())
      .catch(() => syncAlarms());
  } else {
    syncAlarms();
  }

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
