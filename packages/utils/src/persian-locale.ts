/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { EStartOfTheWeek } from "@plane/types";

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

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** Convert ASCII digits to Persian digits. */
export const toPersianDigits = (value: string | number): string =>
  String(value).replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)] ?? digit);

/** Apply Persian digits when the UI locale is FA. */
export const localizeDigits = (value: string | number): string =>
  isPersianLocale() ? toPersianDigits(value) : String(value);

/**
 * Iranian calendars start on Saturday. Western preference is kept for non-FA.
 */
export const getCalendarStartOfWeek = (preference?: EStartOfTheWeek | null): EStartOfTheWeek => {
  if (isPersianLocale()) return EStartOfTheWeek.SATURDAY;
  return preference ?? EStartOfTheWeek.SUNDAY;
};

/**
 * Weekend days for calendar chrome: Thu+Fri in FA, Sat+Sun otherwise.
 */
export const isCalendarWeekend = (date: Date): boolean => {
  const day = date.getDay();
  if (isPersianLocale()) return day === EStartOfTheWeek.THURSDAY || day === EStartOfTheWeek.FRIDAY;
  return day === EStartOfTheWeek.SUNDAY || day === EStartOfTheWeek.SATURDAY;
};

export const shouldShowCalendarDay = (date: Date, showWeekends: boolean): boolean => {
  if (showWeekends) return true;
  return !isCalendarWeekend(date);
};

export const isCalendarWeekendWeekday = (weekday: EStartOfTheWeek): boolean => {
  if (isPersianLocale()) return weekday === EStartOfTheWeek.THURSDAY || weekday === EStartOfTheWeek.FRIDAY;
  return weekday === EStartOfTheWeek.SUNDAY || weekday === EStartOfTheWeek.SATURDAY;
};
