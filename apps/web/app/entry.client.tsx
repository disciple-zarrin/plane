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
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).then(() => {
      void import("@/services/web-push.service").then((m) => m.flushLocalAlarms());
    }).catch(() => {
      /* ignore */
    });
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      void import("@/services/web-push.service").then((m) => m.flushLocalAlarms());
    }
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
