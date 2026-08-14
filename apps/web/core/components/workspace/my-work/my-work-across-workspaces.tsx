/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { Link } from "react-router";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import {
  BoardLayoutIcon,
  CalendarLayoutIcon,
  ListLayoutIcon,
  TimelineLayoutIcon,
} from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { cn } from "@plane/utils";
import { IssueService } from "@/services/issue/issue.service";
import { UserService, type TUserAssignedIssue } from "@/services/user.service";

const service = new UserService();
const issueService = new IssueService();

type TLayout = "list" | "board" | "calendar" | "timeline";

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

const LAYOUTS: { key: TLayout; label: string; Icon: typeof ListLayoutIcon }[] = [
  { key: "list", label: "لیست", Icon: ListLayoutIcon },
  { key: "board", label: "برد", Icon: BoardLayoutIcon },
  { key: "calendar", label: "تقویم", Icon: CalendarLayoutIcon },
  { key: "timeline", label: "تایم‌لاین", Icon: TimelineLayoutIcon },
];

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

function formatDate(value: string | null) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "short", day: "numeric" }).format(
      new Date(value)
    );
  } catch {
    return value;
  }
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

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
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
  onDragOver,
  onDrop,
}: {
  issue: TUserAssignedIssue;
  draggable?: boolean;
  onDragStart?: (issueId: string) => void;
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
  const [items, setItems] = useState<TUserAssignedIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [includeDone, setIncludeDone] = useState(false);
  const [layout, setLayout] = useState<TLayout>("list");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()));

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const savingOrderRef = useRef(false);
  const requestIdRef = useRef(0);

  const pageSize = layout === "list" ? 25 : 200;

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const data = await service.assignedIssuesAcrossWorkspaces({
        include_done: includeDone,
        page,
        page_size: pageSize,
      });
      if (requestId !== requestIdRef.current) return;
      setItems(Array.isArray(data?.results) ? data.results : []);
      setTotal(data?.count || 0);
      setTotalPages(data?.total_pages || 1);
    } catch {
      if (requestId !== requestIdRef.current) return;
      setItems([]);
      setTotal(0);
      setTotalPages(1);
      setError("بارگذاری کارهای من انجام نشد.");
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [includeDone, page, pageSize]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const changeLayout = (next: TLayout) => {
    setPage(1);
    setLayout(next);
  };

  const changeIncludeDone = (checked: boolean) => {
    setPage(1);
    setIncludeDone(checked);
  };

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

  const persistBoardOrder = useCallback(
    async (draggedId: string, columnKey: string, targetId: string | null) => {
      if (savingOrderRef.current || draggedId === targetId) {
        clearDragging();
        return;
      }
      const column = boardColumns.find((c) => c.key === columnKey);
      const dragged = items.find((i) => i.id === draggedId);
      if (!column || !dragged) {
        clearDragging();
        return;
      }
      if (stateGroupOf(dragged) !== columnKey) {
        clearDragging();
        return;
      }

      if (targetId) {
        const target = column.issues.find((i) => i.id === targetId);
        if (target && target.project.id !== dragged.project.id) {
          clearDragging();
          setToast({
            type: TOAST_TYPE.INFO,
            title: "ترتیب داخل پروژه",
            message: "جابه‌جایی فقط نسبت به تسک‌های همان پروژه ذخیره می‌شود.",
          });
          return;
        }
      }

      const newSort = computeSortOrder(column.issues, dragged, targetId);
      if (newSort === null) {
        clearDragging();
        return;
      }

      const previous = items;
      setItems((prev) => prev.map((i) => (i.id === draggedId ? { ...i, sort_order: newSort } : i)));
      savingOrderRef.current = true;
      try {
        await issueService.patchIssue(dragged.workspace.slug, dragged.project.id, dragged.id, {
          sort_order: newSort,
        });
      } catch {
        setItems(previous);
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "خطا",
          message: "ذخیرهٔ ترتیب تسک انجام نشد.",
        });
      } finally {
        savingOrderRef.current = false;
        clearDragging();
      }
    },
    [boardColumns, items]
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
      return { rows: dated, min: today, max: new Date(today.getTime() + 14 * 86400000), spanMs: 14 * 86400000 };
    }
    const min = new Date(Math.min(...dated.map((r) => r.start.getTime())));
    const max = new Date(Math.max(...dated.map((r) => r.end.getTime())));
    min.setDate(min.getDate() - 2);
    max.setDate(max.getDate() + 2);
    const spanMs = Math.max(max.getTime() - min.getTime(), 7 * 86400000);
    return { rows: dated, min, max, spanMs };
  }, [items]);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-subtle px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold text-primary">کارهای من</h1>
          <p className="text-13 text-tertiary">
            همهٔ تسک‌های assign‌شده در همه ورک‌اسپیس‌ها
            {!loading && <span className="ms-2 text-secondary">({total})</span>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-md border border-subtle bg-surface-2 p-1">
            {LAYOUTS.map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                title={label}
                onClick={() => changeLayout(key)}
                className={cn(
                  "flex items-center gap-1.5 rounded px-2 py-1 text-11 transition-colors",
                  layout === key ? "bg-surface-1 text-primary shadow-sm" : "text-tertiary hover:text-secondary"
                )}
              >
                <Icon className="size-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-13 text-secondary">
            <input
              type="checkbox"
              className="size-4 rounded border-subtle"
              checked={includeDone}
              onChange={(e) => changeIncludeDone(e.target.checked)}
            />
            انجام‌شده / لغوشده
          </label>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-6 py-4">
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
                    <tbody>
                      {group.issues.map((issue) => (
                        <tr key={issue.id} className="border-t border-subtle hover:bg-surface-2/60">
                          <td className="whitespace-nowrap px-3 py-2 tabular-nums text-tertiary">
                            <Link to={issueHref(issue)} className="hover:text-accent-primary">
                              {issue.project.identifier}-{issue.sequence_id}
                            </Link>
                          </td>
                          <td className="max-w-[28rem] px-3 py-2">
                            <Link
                              to={issueHref(issue)}
                              className="line-clamp-1 font-medium text-primary hover:text-accent-primary"
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
                          <td className="whitespace-nowrap px-3 py-2 text-secondary">{formatDate(issue.target_date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
                <p className="mt-2 px-1 text-11 text-tertiary">کشیدن داخل همان پروژه؛ ترتیب ذخیره می‌شود</p>
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
                      {dayIssues.slice(0, 3).map((issue) => (
                        <Link
                          key={issue.id}
                          to={issueHref(issue)}
                          className="block truncate rounded bg-accent-primary/10 px-1.5 py-0.5 text-[10px] text-accent-primary hover:bg-accent-primary/20"
                          title={issue.name}
                        >
                          {issue.project.identifier}-{issue.sequence_id}
                        </Link>
                      ))}
                      {dayIssues.length > 3 && (
                        <div className="px-1 text-[10px] text-tertiary">+{dayIssues.length - 3}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {items.filter((i) => !i.target_date).length > 0 && (
              <p className="mt-3 text-11 text-tertiary">
                {items.filter((i) => !i.target_date).length} تسک بدون ددلاین در تقویم نشان داده نمی‌شود.
              </p>
            )}
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
                        <Link to={issueHref(issue)} className="truncate text-13 text-primary hover:text-accent-primary">
                          {issue.project.identifier}-{issue.sequence_id} · {issue.name}
                        </Link>
                        <div className="relative h-8 rounded bg-surface-2">
                          <Link
                            to={issueHref(issue)}
                            className="absolute top-1 h-6 truncate rounded-md bg-accent-primary/80 px-2 text-11 leading-6 text-on-color"
                            style={{ insetInlineStart: `${offset}%`, width: `${width}%` }}
                            title={`${formatDate(localDateKey(start))} → ${formatDate(localDateKey(end))}`}
                          >
                            {issue.workspace.name}
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {!loading && !error && total > 0 && (
        <div className="flex items-center justify-between gap-3 border-t border-subtle px-6 py-3 text-13">
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
