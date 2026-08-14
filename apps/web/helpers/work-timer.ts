/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export const WORK_TIMER_STORAGE_KEY = "plane-work-timer";
export const WORK_TIMER_EVENT = "plane:work-timer";

export type TWorkTimerState = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueName?: string;
  running: boolean;
  startedAt: number | null;
  accumulatedMs: number;
};

export const readWorkTimer = (): TWorkTimerState | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(WORK_TIMER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TWorkTimerState;
    if (!parsed?.issueId) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const elapsedMs = (state: TWorkTimerState | null, now = Date.now()): number => {
  if (!state) return 0;
  const runningPart = state.running && state.startedAt ? Math.max(0, now - state.startedAt) : 0;
  return Math.max(0, (state.accumulatedMs || 0) + runningPart);
};

export const writeWorkTimer = (state: TWorkTimerState | null) => {
  if (typeof window === "undefined") return;
  if (!state) {
    window.localStorage.removeItem(WORK_TIMER_STORAGE_KEY);
  } else {
    window.localStorage.setItem(WORK_TIMER_STORAGE_KEY, JSON.stringify(state));
  }
  window.dispatchEvent(new CustomEvent(WORK_TIMER_EVENT, { detail: state }));
};

export const formatClock = (ms: number): string => {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

export const msToMinutes = (ms: number): number => Math.max(0, Math.round(ms / 60000));
