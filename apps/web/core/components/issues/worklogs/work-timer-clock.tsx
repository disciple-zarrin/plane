/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo, useState } from "react";
import { Pause, Play, Plus } from "lucide-react";
import { Button } from "@plane/propel/button";
import { cn } from "@plane/utils";
import { elapsedMs, formatClock, type TWorkTimerState } from "@/helpers/work-timer";

type Props = {
  timer: TWorkTimerState | null;
  belongsToThisIssue: boolean;
  disabled?: boolean;
  onStart: () => void;
  onStop: () => void;
  onAdd: () => void;
  adding?: boolean;
};

export function WorkTimerClock(props: Props) {
  const { timer, belongsToThisIssue, disabled, onStart, onStop, onAdd, adding } = props;
  const [now, setNow] = useState(() => Date.now());

  const active = Boolean(timer && belongsToThisIssue);
  const running = Boolean(active && timer?.running);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [running]);

  const ms = active ? elapsedMs(timer, now) : 0;
  const seconds = Math.floor(ms / 1000) % 60;
  const progress = seconds / 60;
  const radius = 46;
  const circ = 2 * Math.PI * radius;
  const dash = circ * progress;
  const minutesReady = Math.round(ms / 60000);

  const status = useMemo(() => {
    if (!active) return "برای شروع زمان‌گیری دکمه شروع را بزن";
    if (running) return "در حال زمان‌گیری…";
    if (minutesReady < 1) return "متوقف شد — حداقل ۱ دقیقه لازم است";
    return "متوقف شد — افزودن به ساعت کاری";
  }, [active, running, minutesReady]);

  return (
    <div className="rounded-xl border border-subtle bg-gradient-to-b from-surface-2/80 to-surface-1 p-4">
      <div className="flex flex-col items-center gap-3">
        <div className="relative size-[132px]">
          <svg viewBox="0 0 120 120" className="size-full -rotate-90">
            <circle cx="60" cy="60" r={radius} fill="none" className="stroke-subtle" strokeWidth="8" />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              className={cn(running ? "stroke-accent-primary" : "stroke-secondary")}
              strokeDasharray={`${dash} ${circ}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={cn(
                "font-semibold tabular-nums tracking-wide text-primary text-[22px] leading-none",
                running && "text-accent-primary"
              )}
            >
              {formatClock(ms)}
            </span>
            <span className="mt-1 text-[10px] text-tertiary">{running ? "در حال کار" : "آماده"}</span>
          </div>
          {running && <span className="absolute right-2 top-2 size-2.5 animate-pulse rounded-full bg-accent-primary" />}
        </div>
        <p className="text-center text-11 text-tertiary">{status}</p>
        {!disabled && (
          <div className="flex w-full flex-wrap items-center justify-center gap-2">
            {!running ? (
              <Button variant="primary" size="sm" onClick={onStart} disabled={adding}>
                <Play className="size-3.5" />
                شروع
              </Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={onStop}>
                <Pause className="size-3.5" />
                توقف
              </Button>
            )}
            <Button variant="tertiary" size="sm" onClick={onAdd} disabled={adding || running || minutesReady < 1}>
              <Plus className="size-3.5" />
              {adding ? "…" : "افزودن به ساعت کاری"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
