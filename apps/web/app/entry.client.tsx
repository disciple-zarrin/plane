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

const purgeStaleCaches = async () => {
  if (typeof window !== "undefined" && "caches" in window) {
    try {
      const keys = await caches.keys();
      const deletePromises = keys
        .filter((key) => key === "start-url" || key.includes("precache") || key.includes("workbox"))
        .map((key) => caches.delete(key));
      await Promise.all(deletePromises);
    } catch (_) {}
  }
};

const syncAlarms = async () => {
  try {
    const m = await import("@/services/web-push.service");
    await m.syncPendingAlarmsFromServer();
    await m.flushLocalAlarms();
  } catch (err) {
    console.warn("Alarm sync error:", err);
  }
};

const registerServiceWorker = async () => {
  await purgeStaleCaches();
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      try {
        await registration.update();
      } catch (_) {}
    } catch (_) {}
  }
  await syncAlarms();
};

if (typeof window !== "undefined") {
  window.addEventListener("load", () => {
    void registerServiceWorker();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void syncAlarms();
  });
  window.addEventListener("online", () => {
    void syncAlarms();
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
