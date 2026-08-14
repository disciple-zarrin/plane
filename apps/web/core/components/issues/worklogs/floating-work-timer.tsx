/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { Pause, Timer } from "lucide-react";
import { Link } from "react-router";
import { cn } from "@plane/utils";
import {
  WORK_TIMER_EVENT,
  elapsedMs,
  formatClock,
  readWorkTimer,
  writeWorkTimer,
  type TWorkTimerState,
} from "@/helpers/work-timer";

export function FloatingWorkTimer() {
  const [timer, setTimer] = useState<TWorkTimerState | null>(() => readWorkTimer());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const sync = () => setTimer(readWorkTimer());
    window.addEventListener(WORK_TIMER_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(WORK_TIMER_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (!timer?.running) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [timer?.running]);

  if (!timer) return null;

  const ms = elapsedMs(timer, now);
  const href = `/${timer.workspaceSlug}/projects/${timer.projectId}/issues/${timer.issueId}`;

  const onStop = () => {
    const current = readWorkTimer();
    if (!current) return;
    writeWorkTimer({
      ...current,
      running: false,
      accumulatedMs: elapsedMs(current),
      startedAt: null,
    });
    setTimer(readWorkTimer());
  };

  return (
    <div className="pointer-events-none fixed bottom-5 end-5 z-[80]">
      <div
        className={cn(
          "pointer-events-auto flex items-center gap-3 rounded-full border border-subtle bg-surface-1/95 px-3 py-2 shadow-raised-200 backdrop-blur",
          timer.running && "border-accent-primary/40"
        )}
      >
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-full",
            timer.running ? "bg-accent-primary/15 text-accent-primary" : "bg-surface-2 text-secondary"
          )}
        >
          <Timer className="size-4" />
        </span>
        <Link to={href} className="min-w-0">
          <div className="max-w-[11rem] truncate text-11 text-tertiary">{timer.issueName || "تسک فعال"}</div>
          <div className="font-semibold tabular-nums text-primary">{formatClock(ms)}</div>
        </Link>
        {timer.running && (
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-full bg-surface-2 text-secondary hover:bg-layer-transparent-hover hover:text-primary"
            onClick={onStop}
            title="توقف"
          >
            <Pause className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
