/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/** Detect Persian UI locale (client-side). Used for Jalali calendar display. */
export const isPersianLocale = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    const stored = window.localStorage?.getItem("userLanguage");
    if (stored === "fa") return true;
  } catch {
    // ignore storage access errors
  }
  const lang = document.documentElement?.lang || "";
  return lang === "fa" || lang.startsWith("fa-");
};
