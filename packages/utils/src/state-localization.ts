/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { isPersianLocale } from "./persian-locale";

const DEFAULT_STATE_NAMES_FA: Record<string, string> = {
  backlog: "انباشته",
  todo: "برای انجام",
  "to do": "برای انجام",
  "in progress": "در حال انجام",
  in_progress: "در حال انجام",
  done: "انجام‌شده",
  completed: "تکمیل‌شده",
  cancelled: "لغوشده",
  canceled: "لغوشده",
  unstarted: "شروع‌نشده",
  started: "شروع‌شده",
};

const DEFAULT_PRIORITY_NAMES_FA: Record<string, string> = {
  none: "هیچ‌کدام",
  low: "پایین",
  medium: "متوسط",
  high: "بالا",
  urgent: "فوری",
};

/**
 * Returns localized state display name for Persian locale, or original name if not translated / not Persian.
 */
export const getStateDisplayName = (name?: string | null): string => {
  if (!name) return "";
  if (!isPersianLocale()) return name;
  const key = name.trim().toLowerCase();
  return DEFAULT_STATE_NAMES_FA[key] ?? name;
};

/**
 * Returns localized priority display name for Persian locale, or original name if not Persian.
 */
export const getPriorityDisplayName = (priority?: string | null, fallback?: string): string => {
  if (!priority) return fallback ?? "";
  if (!isPersianLocale()) return fallback ?? priority;
  const key = priority.trim().toLowerCase();
  return DEFAULT_PRIORITY_NAMES_FA[key] ?? fallback ?? priority;
};
