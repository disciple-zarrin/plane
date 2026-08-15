/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useMemo, useRef, useState, type DragEvent } from "react";
import { Link } from "react-router";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { cn } from "@plane/utils";
import type { TUserAssignedIssue } from "@/services/user.service";
import type { ProjectStateService } from "@/services/project/project-state.service";
import { myWorkIssueService as issueService, myWorkStateService as stateService, useMyWork } from "./my-work-provider";

const statesCache = new Map<string, Awaited<ReturnType<ProjectStateService["getStates"]>>>();

async function statesForProject(workspaceSlug: string, projectId: string) {
  const key = `${workspaceSlug}:${projectId}`;
  if (!statesCache.has(key)) {
    statesCache.set(key, await stateService.getStates(workspaceSlug, projectId));
  }
  return statesCache.get(key) || [];
}

function pickStateInGroup(
  states: Awaited<ReturnType<ProjectStateService["getStates"]>>,
  group: string
) {
  const inGroup = states
    .filter((s) => s.group === group)
    .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
  return inGroup.find((s) => s.default) || inGroup[0] || null;
}

const SORT_GAP = 65535;

const PRIORITY_LABEL: Record<string, string> = {
  urgent: "فوری",
  high: "بالا",
  medium: "متوسط",
  low: "پایین",
  none: "—",
};

const STATE_GROUP_ORDER = ["backlog", "unstarted", "started", "completed", "cancelled", "triage"];
const STATE_GROUP_LABEL: Record<string, string> = {
  backlog: "بک‌لاگ",
  unstarted: "انجام‌نشده",
  started: "در حال پردازش",
  completed: "انجام‌شده",
  cancelled: "لغوشده",
  triage: "تریاژ",
};

function issueHref(issue: TUserAssignedIssue) {
  return `/${issue.workspace.slug}/projects/${issue.project.id}/issues/${issue.id}`;
}

function stateGroupOf(issue: TUserAssignedIssue) {
  return issue.state.group || "unstarted";
}

function localDateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function sortIssues(issues: TUserAssignedIssue[]) {
  return [...issues].sort((a, b) => {
    const projectCmp = a.project.id.localeCompare(b.project.id);
    if (projectCmp !== 0) return projectCmp;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });
}

/**
 * Insert dragged card before targetId (or at end if targetId is null).
 * Only peers from the same project are used — sort_order is per-project.
 */
function computeSortOrder(
  columnIssues: TUserAssignedIssue[],
  dragged: TUserAssignedIssue,
  targetId: string | null
): number | null {
  const sameProject = columnIssues.filter((i) => i.project.id === dragged.project.id && i.id !== dragged.id);

  if (targetId) {
    const target = columnIssues.find((i) => i.id === targetId);
    if (!target) return null;
    if (target.project.id !== dragged.project.id) return null;
  }

  if (sameProject.length === 0) return SORT_GAP;
  if (!targetId) {
    return (sameProject[sameProject.length - 1]?.sort_order ?? 0) + SORT_GAP;
  }

  const idx = sameProject.findIndex((i) => i.id === targetId);
  if (idx === -1) return null;
  if (idx === 0) {
    return (sameProject[0]?.sort_order ?? SORT_GAP) - SORT_GAP;
  }
  const top = sameProject[idx - 1]?.sort_order ?? 0;
  const bottom = sameProject[idx]?.sort_order ?? top + SORT_GAP;
  return (top + bottom) / 2;
}

function parseDay(value: string | null): Date | null {
  if (!value) return null;
  // Date-only strings are treated as local midnight to avoid UTC shifts.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const key = value.slice(0, 10);
  const d = /^\d{4}-\d{2}-\d{2}$/.test(key) ? parseDay(key) : parseDay(value);
  if (!d) return value;
  try {
    return new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "short", day: "numeric" }).format(d);
  } catch {
    return value;
  }
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function addDays(d: Date, n: number) {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

function pointerRatioInTrack(e: { clientX: number }, el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0) return 0;
  const rtl = getComputedStyle(el).direction === "rtl";
  const raw = rtl ? (rect.right - e.clientX) / rect.width : (e.clientX - rect.left) / rect.width;
  return Math.max(0, Math.min(1, raw));
}

function daysInMonthGrid(month: Date) {
  const first = startOfMonth(month);
  const startPad = (first.getDay() + 6) % 7; // Monday-first
  const days: Date[] = [];
  for (let i = 0; i < startPad; i++) {
    const d = new Date(first);
    d.setDate(d.getDate() - (startPad - i));
    days.push(d);
  }
  const cursor = new Date(first);
  while (cursor.getMonth() === first.getMonth()) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  while (days.length % 7 !== 0) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function IssueCard({
  issue,
  draggable,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  issue: TUserAssignedIssue;
  draggable?: boolean;
  onDragStart?: (issueId: string) => void;
  onDragEnd?: () => void;
  onDragOver?: (e: DragEvent, issueId: string) => void;
  onDrop?: (e: DragEvent, issueId: string) => void;
}) {
  return (
    <div
      draggable={draggable}
      onDragStart={(e) => {
        if (!draggable) return;
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", issue.id);
        onDragStart?.(issue.id);
      }}
      onDragEnd={() => {
        if (!draggable) return;
        onDragEnd?.();
      }}
      onDragOver={(e) => {
        if (!draggable) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        onDragOver?.(e, issue.id);
      }}
      onDrop={(e) => {
        if (!draggable) return;
        e.preventDefault();
        e.stopPropagation();
        onDrop?.(e, issue.id);
      }}
      className={cn(
        "rounded-md border border-subtle bg-surface-1 px-2.5 py-2 hover:border-accent-primary/40",
        draggable && "cursor-grab active:cursor-grabbing"
      )}
    >
      <Link to={issueHref(issue)} className="block" draggable={false} onClick={(e) => e.stopPropagation()}>
        <div className="mb-1 text-11 tabular-nums text-tertiary">
          {issue.project.identifier}-{issue.sequence_id}
        </div>
        <div className="line-clamp-2 text-13 font-medium text-primary">{issue.name}</div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-11 text-tertiary">
          <span>{issue.workspace.name}</span>
          <span>·</span>
          <span>{PRIORITY_LABEL[issue.priority || "none"] || issue.priority}</span>
        </div>
      </Link>
    </div>
  );
}

export function MyWorkAcrossWorkspaces() {
  const {
    items,
    setItems,
    loading,
    error,
    total,
    totalPages,
    page,
    setPage,
    pageSize,
    layout,
  } = useMyWork();

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()));
  const savingOrderRef = useRef(false);

  const groupedByWorkspace = useMemo(() => {
    const map = new Map<string, { name: string; slug: string; issues: TUserAssignedIssue[] }>();
    for (const issue of items) {
      const key = issue.workspace.slug;
      if (!map.has(key)) map.set(key, { name: issue.workspace.name, slug: key, issues: [] });
      map.get(key)!.issues.push(issue);
    }
    return Array.from(map.values());
  }, [items]);

  const boardColumns = useMemo(() => {
    const map = new Map<string, TUserAssignedIssue[]>();
    for (const g of STATE_GROUP_ORDER) map.set(g, []);
    for (const issue of items) {
      const g = stateGroupOf(issue);
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(issue);
    }
    return STATE_GROUP_ORDER.filter(
      (g) => (map.get(g) || []).length > 0 || ["backlog", "unstarted", "started"].includes(g)
    ).map((g) => ({
      key: g,
      label: STATE_GROUP_LABEL[g] || g,
      issues: sortIssues(map.get(g) || []),
    }));
  }, [items]);

  const clearDragging = () => setDraggingId(null);

  const toastBusy = () =>
    setToast({
      type: TOAST_TYPE.INFO,
      title: "صبر کن",
      message: "ذخیرهٔ قبلی هنوز تموم نشده.",
    });

  const restoreIssueFields = useCallback(
    (
      issueId: string,
      snapshot: TUserAssignedIssue,
      fields: Array<"state" | "sort_order" | "start_date" | "target_date">
    ) => {
      setItems((prev) =>
        prev.map((i) => {
          if (i.id !== issueId) return i;
          const next = { ...i };
          for (const f of fields) {
            if (f === "state") next.state = snapshot.state;
            else if (f === "sort_order") next.sort_order = snapshot.sort_order;
            else if (f === "start_date") next.start_date = snapshot.start_date;
            else if (f === "target_date") next.target_date = snapshot.target_date;
          }
          return next;
        })
      );
    },
    [setItems]
  );

  const calendarDays = useMemo(() => daysInMonthGrid(calendarMonth), [calendarMonth]);

  const issuesByDay = useMemo(() => {
    const map = new Map<string, TUserAssignedIssue[]>();
    for (const issue of items) {
      if (!issue.target_date) continue;
      const key = issue.target_date.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(issue);
    }
    return map;
  }, [items]);

  const undatedIssues = useMemo(() => items.filter((i) => !i.target_date), [items]);

  const timelineRange = useMemo(() => {
    const dated = items
      .map((issue) => {
        const start = parseDay(issue.start_date) || parseDay(issue.target_date);
        const end = parseDay(issue.target_date) || start;
        if (!start || !end) return null;
        return { issue, start, end: end < start ? start : end };
      })
      .filter(Boolean) as { issue: TUserAssignedIssue; start: Date; end: Date }[];

    if (dated.length === 0) {
      const today = new Date();
      const max = new Date(today.getTime() + 14 * 86400000);
      return { rows: dated, min: today, max, spanMs: max.getTime() - today.getTime() };
    }
    const min = new Date(Math.min(...dated.map((r) => r.start.getTime())));
    let max = new Date(Math.max(...dated.map((r) => r.end.getTime())));
    min.setDate(min.getDate() - 2);
    max.setDate(max.getDate() + 2);
    const minSpan = 7 * 86400000;
    if (max.getTime() - min.getTime() < minSpan) {
      max = new Date(min.getTime() + minSpan);
    }
    return { rows: dated, min, max, spanMs: max.getTime() - min.getTime() };
  }, [items]);

  const persistPatch = useCallback(
    async (
      draggedId: string,
      patch: Record<string, unknown>,
      applyOptimistic: (issue: TUserAssignedIssue) => TUserAssignedIssue,
      rollbackFields: Array<"state" | "sort_order" | "start_date" | "target_date">
    ) => {
      if (savingOrderRef.current) {
        toastBusy();
        clearDragging();
        return;
      }
      const dragged = items.find((i) => i.id === draggedId);
      if (!dragged) {
        clearDragging();
        return;
      }
      const snapshot = dragged;
      savingOrderRef.current = true;
      setItems((prev) => prev.map((i) => (i.id === draggedId ? applyOptimistic(i) : i)));
      try {
        await issueService.patchIssue(dragged.workspace.slug, dragged.project.id, dragged.id, patch);
      } catch {
        restoreIssueFields(draggedId, snapshot, rollbackFields);
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "خطا",
          message: "ذخیرهٔ جابه‌جایی تسک انجام نشد.",
        });
      } finally {
        savingOrderRef.current = false;
        clearDragging();
      }
    },
    [items, setItems, restoreIssueFields]
  );

  const persistBoardOrder = useCallback(
    async (draggedId: string, columnKey: string, targetId: string | null) => {
      if (savingOrderRef.current) {
        toastBusy();
        clearDragging();
        return;
      }
      if (draggedId === targetId) {
        clearDragging();
        return;
      }
      const column = boardColumns.find((c) => c.key === columnKey);
      const dragged = items.find((i) => i.id === draggedId);
      if (!column || !dragged) {
        clearDragging();
        return;
      }

      const fromGroup = stateGroupOf(dragged);
      const snapshot = dragged;
      savingOrderRef.current = true;

      try {
        if (targetId) {
          const target = column.issues.find((i) => i.id === targetId);
          if (target && target.project.id !== dragged.project.id) {
            setToast({
              type: TOAST_TYPE.INFO,
              title: "ترتیب داخل پروژه",
              message: "جابه‌جایی فقط نسبت به تسک‌های همان پروژه ذخیره می‌شود.",
            });
            // Still allow cross-group state change without sort when dropping on foreign project.
            if (fromGroup === columnKey) {
              return;
            }
          }
        }

        if (fromGroup !== columnKey) {
          const states = await statesForProject(dragged.workspace.slug, dragged.project.id);
          const nextState = pickStateInGroup(states, columnKey);
          if (!nextState) {
            setToast({
              type: TOAST_TYPE.WARNING,
              title: "وضعیت نیست",
              message: `در این پروژه ستونی برای گروه «${STATE_GROUP_LABEL[columnKey] || columnKey}» تعریف نشده.`,
            });
            return;
          }

          const sameProjectTarget =
            targetId && column.issues.find((i) => i.id === targetId)?.project.id === dragged.project.id
              ? targetId
              : null;
          const newSort = computeSortOrder(column.issues, dragged, sameProjectTarget);
          const patch: Record<string, unknown> = { state_id: nextState.id };
          if (newSort !== null) patch.sort_order = newSort;

          setItems((prev) =>
            prev.map((i) =>
              i.id === draggedId
                ? {
                    ...i,
                    state: {
                      id: nextState.id,
                      name: nextState.name,
                      group: nextState.group,
                      color: nextState.color,
                    },
                    ...(newSort !== null ? { sort_order: newSort } : {}),
                  }
                : i
            )
          );

          await issueService.patchIssue(dragged.workspace.slug, dragged.project.id, dragged.id, patch);
          return;
        }

        const newSort = computeSortOrder(column.issues, dragged, targetId);
        if (newSort === null) {
          setToast({
            type: TOAST_TYPE.WARNING,
            title: "ترتیب ذخیره نشد",
            message: "هدف دراپ برای همین پروژه پیدا نشد.",
          });
          return;
        }

        setItems((prev) => prev.map((i) => (i.id === draggedId ? { ...i, sort_order: newSort } : i)));
        await issueService.patchIssue(dragged.workspace.slug, dragged.project.id, dragged.id, {
          sort_order: newSort,
        });
      } catch {
        restoreIssueFields(draggedId, snapshot, ["state", "sort_order"]);
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "خطا",
          message: "ذخیرهٔ جابه‌جایی تسک انجام نشد.",
        });
      } finally {
        savingOrderRef.current = false;
        clearDragging();
      }
    },
    [boardColumns, items, setItems, restoreIssueFields]
  );

  const persistTargetDate = useCallback(
    async (draggedId: string, targetDate: string | null) => {
      const dragged = items.find((i) => i.id === draggedId);
      if (!dragged) {
        clearDragging();
        return;
      }
      const current = dragged.target_date ? dragged.target_date.slice(0, 10) : null;
      if (current === targetDate) {
        clearDragging();
        return;
      }

      const startKey = dragged.start_date ? dragged.start_date.slice(0, 10) : null;
      // Keep due >= start: if due moves before start, pull start down with it.
      if (targetDate && startKey && targetDate < startKey) {
        await persistPatch(
          draggedId,
          { target_date: targetDate, start_date: targetDate },
          (i) => ({ ...i, target_date: targetDate, start_date: targetDate }),
          ["target_date", "start_date"]
        );
        return;
      }

      await persistPatch(
        draggedId,
        { target_date: targetDate },
        (i) => ({ ...i, target_date: targetDate }),
        ["target_date"]
      );
    },
    [items, persistPatch]
  );

  const persistTimelineDrop = useCallback(
    async (draggedId: string, ratio: number) => {
      const dragged = items.find((i) => i.id === draggedId);
      if (!dragged) {
        clearDragging();
        return;
      }
      const start = parseDay(dragged.start_date) || parseDay(dragged.target_date);
      const end = parseDay(dragged.target_date) || start;
      if (!start || !end) {
        clearDragging();
        return;
      }
      const hasStart = Boolean(dragged.start_date);
      const hasTarget = Boolean(dragged.target_date);
      const durationDays =
        hasStart && hasTarget
          ? Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000))
          : 0;
      const spanDays = Math.max(1, Math.round(timelineRange.spanMs / 86400000));
      const clampedRatio = Math.max(0, Math.min(1, ratio));
      const newStart = addDays(timelineRange.min, Math.round(clampedRatio * spanDays));
      // Keep within labeled axis (ratio already clamped; end may extend past max — clamp start so end fits when both dates).
      let startKey = localDateKey(newStart);
      if (hasStart && hasTarget) {
        const newEnd = addDays(newStart, durationDays);
        const maxKey = localDateKey(timelineRange.max);
        let endKey = localDateKey(newEnd);
        if (endKey > maxKey) {
          const adjustedStart = addDays(timelineRange.max, -durationDays);
          startKey = localDateKey(adjustedStart < timelineRange.min ? timelineRange.min : adjustedStart);
          endKey = localDateKey(addDays(parseDay(startKey)!, durationDays));
        }
        await persistPatch(
          draggedId,
          { start_date: startKey, target_date: endKey },
          (i) => ({ ...i, start_date: startKey, target_date: endKey }),
          ["start_date", "target_date"]
        );
        return;
      }
      if (hasStart && !hasTarget) {
        await persistPatch(
          draggedId,
          { start_date: startKey },
          (i) => ({ ...i, start_date: startKey }),
          ["start_date"]
        );
        return;
      }
      await persistPatch(
        draggedId,
        { target_date: startKey },
        (i) => ({ ...i, target_date: startKey }),
        ["target_date"]
      );
    },
    [items, persistPatch, timelineRange]
  );

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-auto px-page-x py-page-y">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-16 text-tertiary">
            <Loader2 className="size-4 animate-spin" />
            در حال بارگذاری…
          </div>
        )}

        {!loading && error && <p className="py-10 text-center text-13 text-danger-primary">{error}</p>}

        {!loading && !error && items.length === 0 && (
          <p className="py-16 text-center text-13 text-tertiary">تسک بازی برای تو پیدا نشد.</p>
        )}

        {!loading && !error && items.length > 0 && layout === "list" && (
          <>
            {groupedByWorkspace.map((group) => (
              <section key={group.slug} className="mb-8">
                <div className="mb-3 flex items-center gap-2">
                  <h2 className="text-14 font-medium text-primary">{group.name}</h2>
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-11 text-tertiary">{group.issues.length}</span>
                </div>
                <div className="overflow-hidden rounded-lg border border-subtle">
                  <table className="w-full text-start text-13">
                    <thead className="bg-surface-2 text-11 text-tertiary">
                      <tr>
                        <th className="px-3 py-2 font-medium">شناسه</th>
                        <th className="px-3 py-2 font-medium">عنوان</th>
                        <th className="px-3 py-2 font-medium">پروژه</th>
                        <th className="px-3 py-2 font-medium">وضعیت</th>
                        <th className="px-3 py-2 font-medium">اولویت</th>
                        <th className="px-3 py-2 font-medium">ددلاین</th>
                      </tr>
                    </thead>
                    {STATE_GROUP_ORDER.map((groupKey) => {
                      const sectionIssues = sortIssues(
                        group.issues.filter((i) => stateGroupOf(i) === groupKey)
                      );
                      if (
                        sectionIssues.length === 0 &&
                        !["backlog", "unstarted", "started"].includes(groupKey)
                      ) {
                        return null;
                      }
                      return (
                        <tbody
                          key={groupKey}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const id = e.dataTransfer.getData("text/plain") || draggingId;
                            if (id) void persistBoardOrder(id, groupKey, null);
                            else clearDragging();
                          }}
                        >
                          <tr className="border-t border-subtle bg-surface-2/80">
                            <td colSpan={6} className="px-3 py-1.5 text-11 font-medium text-tertiary">
                              {STATE_GROUP_LABEL[groupKey] || groupKey}
                              <span className="ms-2 tabular-nums">({sectionIssues.length})</span>
                            </td>
                          </tr>
                          {sectionIssues.map((issue) => (
                            <tr
                              key={issue.id}
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.effectAllowed = "move";
                                e.dataTransfer.setData("text/plain", issue.id);
                                setDraggingId(issue.id);
                              }}
                              onDragEnd={clearDragging}
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = "move";
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const id = e.dataTransfer.getData("text/plain") || draggingId;
                                if (id) void persistBoardOrder(id, groupKey, issue.id);
                                else clearDragging();
                              }}
                              className={cn(
                                "cursor-grab border-t border-subtle hover:bg-surface-2/60 active:cursor-grabbing",
                                draggingId === issue.id && "opacity-60"
                              )}
                            >
                              <td className="whitespace-nowrap px-3 py-2 tabular-nums text-tertiary">
                                <Link
                                  to={issueHref(issue)}
                                  className="hover:text-accent-primary"
                                  draggable={false}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {issue.project.identifier}-{issue.sequence_id}
                                </Link>
                              </td>
                              <td className="max-w-[28rem] px-3 py-2">
                                <Link
                                  to={issueHref(issue)}
                                  className="line-clamp-1 font-medium text-primary hover:text-accent-primary"
                                  draggable={false}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {issue.name}
                                </Link>
                              </td>
                              <td className="whitespace-nowrap px-3 py-2 text-secondary">{issue.project.name}</td>
                              <td className="whitespace-nowrap px-3 py-2">
                                <span className="inline-flex items-center gap-1.5 text-secondary">
                                  <span
                                    className="size-2 rounded-full"
                                    style={{ backgroundColor: issue.state.color || "#94a3b8" }}
                                  />
                                  {issue.state.name || "—"}
                                </span>
                              </td>
                              <td
                                className={cn(
                                  "whitespace-nowrap px-3 py-2",
                                  issue.priority === "urgent" || issue.priority === "high"
                                    ? "text-danger-primary"
                                    : "text-secondary"
                                )}
                              >
                                {PRIORITY_LABEL[issue.priority || "none"] || issue.priority || "—"}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2 text-secondary">
                                {formatDate(issue.target_date)}
                              </td>
                            </tr>
                          ))}
                          {sectionIssues.length === 0 && (
                            <tr className="border-t border-dashed border-subtle">
                              <td colSpan={6} className="px-3 py-3 text-center text-11 text-tertiary">
                                خالی — اینجا رها کن تا وضعیت عوض شود
                              </td>
                            </tr>
                          )}
                        </tbody>
                      );
                    })}
                  </table>
                </div>
                <p className="mt-2 text-11 text-tertiary">
                  بکش بین گروه‌های وضعیت = عوض شدن وضعیت؛ روی ردیف همان پروژه = ترتیب
                </p>
              </section>
            ))}
          </>
        )}

        {!loading && !error && items.length > 0 && layout === "board" && (
          <div className="flex min-h-full gap-3 overflow-x-auto pb-2">
            {boardColumns.map((col) => (
              <div
                key={col.key}
                className="w-72 shrink-0 rounded-lg border border-subtle bg-surface-2/40 p-2"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/plain") || draggingId;
                  if (id) void persistBoardOrder(id, col.key, null);
                  else clearDragging();
                }}
              >
                <div className="mb-2 flex items-center justify-between px-1">
                  <span className="text-13 font-medium text-primary">{col.label}</span>
                  <span className="text-11 text-tertiary">{col.issues.length}</span>
                </div>
                <div className="space-y-2">
                  {col.issues.map((issue) => (
                    <IssueCard
                      key={issue.id}
                      issue={issue}
                      draggable
                      onDragStart={setDraggingId}
                      onDragEnd={clearDragging}
                      onDrop={(e, targetId) => {
                        const id = e.dataTransfer.getData("text/plain") || draggingId;
                        if (id) void persistBoardOrder(id, col.key, targetId);
                        else clearDragging();
                      }}
                    />
                  ))}
                  {col.issues.length === 0 && (
                    <div className="rounded-md border border-dashed border-subtle px-2 py-6 text-center text-11 text-tertiary">
                      خالی
                    </div>
                  )}
                </div>
                <p className="mt-2 px-1 text-11 text-tertiary">
                  بکش بین ستون‌ها = عوض شدن وضعیت؛ داخل ستون همان پروژه = ترتیب
                </p>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && items.length > 0 && layout === "calendar" && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                className="rounded-md border border-subtle px-2 py-1 text-13 text-secondary hover:bg-surface-2"
                onClick={() => setCalendarMonth((m) => addMonths(m, -1))}
              >
                ماه قبل
              </button>
              <div className="text-14 font-medium text-primary">
                {new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "long" }).format(calendarMonth)}
              </div>
              <button
                type="button"
                className="rounded-md border border-subtle px-2 py-1 text-13 text-secondary hover:bg-surface-2"
                onClick={() => setCalendarMonth((m) => addMonths(m, 1))}
              >
                ماه بعد
              </button>
            </div>
            <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-subtle bg-subtle">
              {["د", "س", "چ", "پ", "ج", "ش", "ی"].map((d) => (
                <div key={d} className="bg-surface-2 px-2 py-1.5 text-center text-11 text-tertiary">
                  {d}
                </div>
              ))}
              {calendarDays.map((day) => {
                const key = localDateKey(day);
                const dayIssues = issuesByDay.get(key) || [];
                const inMonth = day.getMonth() === calendarMonth.getMonth();
                return (
                  <div
                    key={key}
                    className={cn("min-h-28 bg-surface-1 p-1.5", !inMonth && "bg-surface-2/50 text-placeholder")}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const id = e.dataTransfer.getData("text/plain") || draggingId;
                      if (id) void persistTargetDate(id, key);
                      else clearDragging();
                    }}
                  >
                    <div
                      className={cn(
                        "mb-1 text-11 tabular-nums",
                        sameDay(day, new Date()) ? "font-semibold text-accent-primary" : "text-tertiary"
                      )}
                    >
                      {new Intl.DateTimeFormat("fa-IR", { day: "numeric" }).format(day)}
                    </div>
                    <div className="space-y-1">
                      {dayIssues.slice(0, 4).map((issue) => (
                        <div
                          key={issue.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.effectAllowed = "move";
                            e.dataTransfer.setData("text/plain", issue.id);
                            setDraggingId(issue.id);
                          }}
                          onDragEnd={clearDragging}
                          className={cn(
                            "cursor-grab truncate rounded bg-accent-primary/10 px-1.5 py-0.5 text-[10px] text-accent-primary hover:bg-accent-primary/20 active:cursor-grabbing",
                            draggingId === issue.id && "opacity-50"
                          )}
                          title={issue.name}
                        >
                          <Link
                            to={issueHref(issue)}
                            className="block truncate"
                            draggable={false}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {issue.project.identifier}-{issue.sequence_id}
                          </Link>
                        </div>
                      ))}
                      {dayIssues.length > 4 && (
                        <div className="px-1 text-[10px] text-tertiary">+{dayIssues.length - 4}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div
              className="mt-3 rounded-lg border border-dashed border-subtle bg-surface-2/40 p-3"
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain") || draggingId;
                if (id) void persistTargetDate(id, null);
                else clearDragging();
              }}
            >
              <div className="mb-2 text-12 font-medium text-secondary">بدون ددلاین</div>
              {undatedIssues.length === 0 ? (
                <p className="text-11 text-tertiary">اینجا رها کن تا ددلاین پاک شود.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {undatedIssues.map((issue) => (
                    <div
                      key={issue.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", issue.id);
                        setDraggingId(issue.id);
                      }}
                      onDragEnd={clearDragging}
                      className="cursor-grab rounded bg-surface-1 px-2 py-1 text-11 text-secondary active:cursor-grabbing"
                      title={issue.name}
                    >
                      <Link to={issueHref(issue)} draggable={false} onClick={(e) => e.stopPropagation()}>
                        {issue.project.identifier}-{issue.sequence_id}
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="mt-2 text-11 text-tertiary">بکش روی روز دیگر = عوض شدن ددلاین</p>
          </div>
        )}

        {!loading && !error && items.length > 0 && layout === "timeline" && (
          <div className="overflow-x-auto rounded-lg border border-subtle">
            {timelineRange.rows.length === 0 ? (
              <p className="p-8 text-center text-13 text-tertiary">
                برای تایم‌لاین، تسک‌ها باید تاریخ شروع یا ددلاین داشته باشند.
              </p>
            ) : (
              <div className="min-w-[720px] p-4">
                <div className="mb-2 flex justify-between text-11 text-tertiary">
                  <span>{formatDate(localDateKey(timelineRange.min))}</span>
                  <span>{formatDate(localDateKey(timelineRange.max))}</span>
                </div>
                <div className="space-y-2">
                  {timelineRange.rows.map(({ issue, start, end }) => {
                    const offset = ((start.getTime() - timelineRange.min.getTime()) / timelineRange.spanMs) * 100;
                    const width = Math.max(((end.getTime() - start.getTime()) / timelineRange.spanMs) * 100, 2);
                    return (
                      <div key={issue.id} className="grid grid-cols-[14rem_1fr] items-center gap-3">
                        <Link
                          to={issueHref(issue)}
                          className="truncate text-13 text-primary hover:text-accent-primary"
                          draggable={false}
                        >
                          {issue.project.identifier}-{issue.sequence_id} · {issue.name}
                        </Link>
                        <div
                          className="relative h-8 rounded bg-surface-2"
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const id = e.dataTransfer.getData("text/plain") || draggingId;
                            if (!id) {
                              clearDragging();
                              return;
                            }
                            const ratio = pointerRatioInTrack(e, e.currentTarget);
                            void persistTimelineDrop(id, ratio);
                          }}
                        >
                          <div
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.effectAllowed = "move";
                              e.dataTransfer.setData("text/plain", issue.id);
                              setDraggingId(issue.id);
                            }}
                            onDragEnd={clearDragging}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = "move";
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const id = e.dataTransfer.getData("text/plain") || draggingId;
                              const track = e.currentTarget.parentElement;
                              if (!id || !track) {
                                clearDragging();
                                return;
                              }
                              const ratio = pointerRatioInTrack(e, track);
                              void persistTimelineDrop(id, ratio);
                            }}
                            className={cn(
                              "absolute top-1 h-6 cursor-grab truncate rounded-md bg-accent-primary/80 px-2 text-11 leading-6 text-on-color active:cursor-grabbing",
                              draggingId === issue.id && "opacity-60"
                            )}
                            style={{ insetInlineStart: `${offset}%`, width: `${width}%` }}
                            title={`${formatDate(localDateKey(start))} → ${formatDate(localDateKey(end))} — بکش برای جابه‌جایی`}
                          >
                            {issue.workspace.name}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-3 text-11 text-tertiary">نوار را روی محور بکش؛ مدت ثابت می‌ماند و تاریخ‌ها جابه‌جا می‌شوند.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {!loading && !error && total > 0 && (
        <div className="flex items-center justify-between gap-3 border-t border-subtle px-page-x py-3 text-13">
          <div className="text-tertiary">
            صفحه {page} از {totalPages}
            {layout !== "list" && total > pageSize && (
              <span className="ms-2">(در برد/تقویم/تایم‌لاین حداکثر {pageSize} مورد در هر صفحه)</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-md border border-subtle px-2.5 py-1.5 text-secondary disabled:cursor-not-allowed disabled:opacity-40 hover:bg-surface-2"
            >
              <ChevronRight className="size-4" />
              قبلی
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 rounded-md border border-subtle px-2.5 py-1.5 text-secondary disabled:cursor-not-allowed disabled:opacity-40 hover:bg-surface-2"
            >
              بعدی
              <ChevronLeft className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
