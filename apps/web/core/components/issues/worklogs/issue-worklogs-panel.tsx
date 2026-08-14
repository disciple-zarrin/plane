/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import { ChevronDown, ChevronUp, Timer, Trash2 } from "lucide-react";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { cn } from "@plane/utils";
import { SidebarPropertyListItem } from "@/components/common/layout/sidebar/property-list-item";
import { WorkTimerClock } from "@/components/issues/worklogs/work-timer-clock";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { WorkLogService, type TIssueWorkLog } from "@/services/worklog.service";
import {
  WORK_TIMER_EVENT,
  elapsedMs,
  formatClock,
  msToMinutes,
  readWorkTimer,
  writeWorkTimer,
  type TWorkTimerState,
} from "@/helpers/work-timer";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled?: boolean;
};

const service = new WorkLogService();

const QUICK_ADD = [
  { label: "۱۵د", minutes: 15 },
  { label: "۳۰د", minutes: 30 },
  { label: "۱س", minutes: 60 },
  { label: "۲س", minutes: 120 },
  { label: "۴س", minutes: 240 },
  { label: "۸س", minutes: 480 },
];

function formatHours(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (minutes <= 0) return "0h";
  if (h <= 0) return `${m}m`;
  if (m <= 0) return `${h}h`;
  return `${h}h ${m}m`;
}

const MAX_ENTRY_MINUTES = 24 * 60;

export const IssueWorklogsPanel = observer(function IssueWorklogsPanel(props: Props) {
  const { workspaceSlug, projectId, issueId, disabled } = props;
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const issue = getIssueById(issueId);
  const issueName = issue?.name || undefined;
  const addingRef = useRef(false);
  const [logs, setLogs] = useState<TIssueWorkLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(true);
  const [hours, setHours] = useState("1");
  const [minutes, setMinutes] = useState("0");
  const [description, setDescription] = useState("");
  const [loggedAt, setLoggedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [addingTimer, setAddingTimer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState<TWorkTimerState | null>(() => readWorkTimer());
  const [now, setNow] = useState(() => Date.now());

  const belongsToThisIssue = timer?.issueId === issueId;
  const runningHere = Boolean(belongsToThisIssue && timer?.running);

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
    if (!runningHere) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [runningHere]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await service.listIssueWorkLogs(workspaceSlug, projectId, issueId);
      setLogs(Array.isArray(data) ? data : []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [workspaceSlug, projectId, issueId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const totalMinutes = useMemo(() => logs.reduce((acc, l) => acc + (l.duration_minutes || 0), 0), [logs]);

  const addMinutes = useMemo(() => {
    const h = Math.max(0, Number(hours) || 0);
    const m = Math.max(0, Math.min(59, Number(minutes) || 0));
    return Math.round(h * 60) + m;
  }, [hours, minutes]);

  const projectedTotal = totalMinutes + addMinutes;

  const applyQuick = (mins: number) => {
    setHours(String(Math.floor(mins / 60)));
    setMinutes(String(mins % 60));
    setOpen(true);
  };

  const onStart = () => {
    const current = readWorkTimer();
    if (current && current.issueId !== issueId) {
      if (current.running || msToMinutes(elapsedMs(current)) >= 1) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "تایمر تسک دیگر باز است",
          message: current.running
            ? "اول تایمر تسک قبلی را متوقف کن."
            : "اول زمان تسک قبلی را به ساعت کاری اضافه کن.",
        });
        return;
      }
    }
    if (current && current.issueId === issueId && !current.running) {
      writeWorkTimer({
        ...current,
        issueName: current.issueName || issueName,
        running: true,
        startedAt: Date.now(),
      });
      setOpen(true);
      return;
    }
    writeWorkTimer({
      workspaceSlug,
      projectId,
      issueId,
      issueName,
      running: true,
      startedAt: Date.now(),
      accumulatedMs: 0,
    });
    setOpen(true);
  };

  const onStop = () => {
    const current = readWorkTimer();
    if (!current || current.issueId !== issueId) return;
    writeWorkTimer({
      ...current,
      running: false,
      accumulatedMs: elapsedMs(current),
      startedAt: null,
    });
  };

  const onSave = async (overrideMinutes?: number, fromTimer = false) => {
    let duration = overrideMinutes ?? addMinutes;
    if (duration < 1) {
      setError("حداقل ۱ دقیقه وارد کنید.");
      return;
    }
    if (duration > MAX_ENTRY_MINUTES) {
      if (fromTimer) duration = MAX_ENTRY_MINUTES;
      else {
        setError("حداکثر ۲۴ ساعت در هر ثبت.");
        return;
      }
    }
    if (fromTimer) {
      addingRef.current = true;
      setAddingTimer(true);
    } else setSaving(true);
    setError(null);
    try {
      await service.createIssueWorkLog(workspaceSlug, projectId, issueId, {
        duration_minutes: duration,
        description: fromTimer ? description || "تایمر" : description,
        logged_at: loggedAt,
      });
      setDescription("");
      setHours("1");
      setMinutes("0");
      if (fromTimer) writeWorkTimer(null);
      await refresh();
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "ثبت شد",
        message: `${formatHours(duration)} به جمع زمان تسک اضافه شد.`,
      });
    } catch {
      setError("ثبت نشد. دوباره تلاش کنید.");
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "خطا",
        message: "ثبت ساعت انجام نشد.",
      });
    } finally {
      setSaving(false);
      setAddingTimer(false);
      addingRef.current = false;
    }
  };

  const onAddTimer = () => {
    if (addingRef.current || addingTimer) return;
    const current = readWorkTimer();
    if (!current || current.issueId !== issueId) return;
    if (current.running) {
      setToast({ type: TOAST_TYPE.ERROR, title: "اول توقف بزن", message: "بعد از توقف می‌توانی به ساعت کاری اضافه کنی." });
      return;
    }
    const mins = Math.min(MAX_ENTRY_MINUTES, msToMinutes(elapsedMs(current)));
    if (mins < 1) return;
    addingRef.current = true;
    void onSave(mins, true);
  };

  const onDelete = async (log: TIssueWorkLog) => {
    try {
      await service.deleteIssueWorkLog(workspaceSlug, projectId, issueId, log.id);
      await refresh();
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "حذف شد",
        message: "ثبت زمان حذف شد.",
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "خطا",
        message: "حذف انجام نشد.",
      });
    }
  };

  const liveMs = belongsToThisIssue ? elapsedMs(timer, now) : 0;

  return (
    <div className="w-full space-y-2">
      <SidebarPropertyListItem icon={Timer} label="زمان صرف‌شده">
        <div className="flex w-full items-center justify-between gap-2">
          <button
            type="button"
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2 py-1 text-body-xs-medium transition-colors",
              "hover:bg-surface-2",
              open && "bg-surface-2"
            )}
            onClick={() => !disabled && setOpen((v) => !v)}
            disabled={disabled}
          >
            <span className="tabular-nums text-primary">{loading ? "…" : formatHours(totalMinutes)}</span>
            {belongsToThisIssue && (
              <span className={cn("tabular-nums text-11", runningHere ? "text-accent-primary" : "text-tertiary")}>
                {formatClock(liveMs)}
              </span>
            )}
            {!disabled && (open ? <ChevronUp className="size-3.5 text-tertiary" /> : <ChevronDown className="size-3.5 text-tertiary" />)}
          </button>
        </div>
      </SidebarPropertyListItem>

      {open && !disabled && (
        <div className="ms-0 space-y-3 rounded-lg border border-subtle bg-surface-1 p-3 sm:ms-[7.5rem]">
          <WorkTimerClock
            timer={timer}
            belongsToThisIssue={belongsToThisIssue}
            disabled={disabled}
            onStart={onStart}
            onStop={onStop}
            onAdd={onAddTimer}
            adding={addingTimer}
          />

          <div className="flex items-center justify-between gap-2 rounded-md border border-subtle bg-surface-2/60 px-3 py-2">
            <div className="text-body-xs-regular text-tertiary">جمع فعلی</div>
            <div className="flex items-center gap-2 text-body-xs-medium">
              <span className="tabular-nums text-primary">{formatHours(totalMinutes)}</span>
              {addMinutes > 0 && (
                <>
                  <span className="text-tertiary">→</span>
                  <span className="tabular-nums text-accent-primary">{formatHours(projectedTotal)}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {QUICK_ADD.map((q) => (
              <button
                key={q.minutes}
                type="button"
                onClick={() => applyQuick(q.minutes)}
                className={cn(
                  "rounded-full border border-subtle px-2.5 py-1 text-11 transition-colors",
                  addMinutes === q.minutes
                    ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
                    : "bg-surface-2 text-secondary hover:border-accent-primary/40"
                )}
              >
                +{q.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1 text-11 text-tertiary">
              ساعت
              <input
                className="w-full rounded-md border border-subtle bg-surface-2 px-2.5 py-1.5 text-body-xs-regular text-primary outline-none focus:border-accent-primary"
                type="number"
                min={0}
                step={1}
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            </label>
            <label className="space-y-1 text-11 text-tertiary">
              دقیقه
              <input
                className="w-full rounded-md border border-subtle bg-surface-2 px-2.5 py-1.5 text-body-xs-regular text-primary outline-none focus:border-accent-primary"
                type="number"
                min={0}
                max={59}
                step={5}
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
              />
            </label>
          </div>

          <label className="block space-y-1 text-11 text-tertiary">
            تاریخ
            <input
              className="w-full rounded-md border border-subtle bg-surface-2 px-2.5 py-1.5 text-body-xs-regular text-primary outline-none focus:border-accent-primary"
              type="date"
              value={loggedAt}
              onChange={(e) => setLoggedAt(e.target.value)}
            />
          </label>

          <label className="block space-y-1 text-11 text-tertiary">
            توضیح (اختیاری)
            <textarea
              className="w-full resize-none rounded-md border border-subtle bg-surface-2 px-2.5 py-1.5 text-body-xs-regular text-primary outline-none focus:border-accent-primary"
              rows={2}
              placeholder="چه کاری انجام شد؟"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          {error && <p className="text-11 text-danger-primary">{error}</p>}

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => onSave()} disabled={saving || addMinutes < 1}>
              {saving ? "…" : `ثبت دستی ${addMinutes > 0 ? formatHours(addMinutes) : ""}`}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={saving}>
              بستن
            </Button>
          </div>
        </div>
      )}

      {logs.length > 0 && (
        <div className="ms-0 max-h-48 space-y-1 overflow-auto rounded-lg border border-subtle bg-surface-1 p-2 sm:ms-[7.5rem]">
          {logs.map((log) => (
            <div
              key={log.id}
              className="group flex items-start justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-surface-2"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 text-body-xs-medium text-primary">
                  <span className="truncate">{log.actor_detail?.display_name || log.actor_detail?.email || "—"}</span>
                  <span className="rounded bg-accent-primary/10 px-1.5 py-0.5 text-11 tabular-nums text-accent-primary">
                    {formatHours(log.duration_minutes)}
                  </span>
                </div>
                <div className="truncate text-11 text-tertiary">
                  {log.logged_at}
                  {log.description ? ` · ${log.description}` : ""}
                </div>
              </div>
              {!disabled && (
                <button
                  type="button"
                  className="shrink-0 rounded p-1 text-tertiary opacity-0 transition-opacity hover:bg-surface-1 hover:text-danger-primary group-hover:opacity-100"
                  onClick={() => onDelete(log)}
                  title="حذف"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
