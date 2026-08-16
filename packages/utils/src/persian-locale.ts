/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/** Detect Persian UI locale (client-side). Used for Jalali calendar display. */
export const isPersianLocale = (): boolean => {
  if (typeof window === "undefined") {
    // SSR / first paint: this fork ships FA as the default experience.
    return true;
  }
  try {
    const stored = window.localStorage?.getItem("userLanguage");
    if (stored === "fa" || (stored && stored.startsWith("fa-"))) return true;
    // Explicit non-FA language chosen by the user → Gregorian.
    if (stored && stored !== "fa" && !stored.startsWith("fa-")) return false;
  } catch {
    // ignore storage access errors
  }
  const lang = document.documentElement?.lang || "";
  if (lang === "fa" || lang.startsWith("fa-")) return true;
  // RTL layout is only used for Persian in this fork.
  if (document.documentElement?.dir === "rtl") return true;
  // No stored language yet → default to Jalali for this FA build.
  return true;
};
