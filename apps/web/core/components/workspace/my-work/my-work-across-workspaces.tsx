/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Loader2 } from "lucide-react";
import { cn } from "@plane/utils";
import { UserService, type TUserAssignedIssue } from "@/services/user.service";

const service = new UserService();

const PRIORITY_LABEL: Record<string, string> = {
  urgent: "فوری",
  high: "بالا",
  medium: "متوسط",
  low: "پایین",
  none: "—",
};

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

export function MyWorkAcrossWorkspaces() {
  const [items, setItems] = useState<TUserAssignedIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [includeDone, setIncludeDone] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await service.assignedIssuesAcrossWorkspaces({ include_done: includeDone });
      setItems(Array.isArray(data?.results) ? data.results : []);
    } catch {
      setItems([]);
      setError("بارگذاری کارهای من انجام نشد.");
    } finally {
      setLoading(false);
    }
  }, [includeDone]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; slug: string; issues: TUserAssignedIssue[] }>();
    for (const issue of items) {
      const key = issue.workspace.slug;
      if (!map.has(key)) {
        map.set(key, { name: issue.workspace.name, slug: key, issues: [] });
      }
      map.get(key)!.issues.push(issue);
    }
    return Array.from(map.values());
  }, [items]);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-subtle px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold text-primary">کارهای من</h1>
          <p className="text-13 text-tertiary">همهٔ تسک‌های assign‌شده به تو در همه ورک‌اسپیس‌ها</p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-13 text-secondary">
          <input
            type="checkbox"
            className="size-4 rounded border-subtle"
            checked={includeDone}
            onChange={(e) => setIncludeDone(e.target.checked)}
          />
          نمایش انجام‌شده و لغوشده
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
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

        {!loading &&
          !error &&
          grouped.map((group) => (
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
                    {group.issues.map((issue) => {
                      const href = `/${issue.workspace.slug}/projects/${issue.project.id}/issues/${issue.id}`;
                      return (
                        <tr key={issue.id} className="border-t border-subtle hover:bg-surface-2/60">
                          <td className="whitespace-nowrap px-3 py-2 tabular-nums text-tertiary">
                            <Link to={href} className="hover:text-accent-primary">
                              {issue.project.identifier}-{issue.sequence_id}
                            </Link>
                          </td>
                          <td className="max-w-[28rem] px-3 py-2">
                            <Link to={href} className="line-clamp-1 font-medium text-primary hover:text-accent-primary">
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
      </div>
    </div>
  );
}
