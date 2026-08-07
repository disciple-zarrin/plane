/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "react-router";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
import { WorkLogService, type TIssueWorkLog, type TWorkLogSummaryRow } from "@/services/worklog.service";

const service = new WorkLogService();

function formatHours(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h <= 0) return `${m}m`;
  if (m <= 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function WorklogsPage() {
  const { workspaceSlug } = useParams();
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const canView = allowPermissions([EUserPermissions.ADMIN, EUserPermissions.MEMBER], EUserPermissionsLevel.WORKSPACE);

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [summary, setSummary] = useState<TWorkLogSummaryRow[]>([]);
  const [rows, setRows] = useState<TIssueWorkLog[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!workspaceSlug) return;
    setLoading(true);
    try {
      const [sum, list] = await Promise.all([
        service.workspaceWorkLogs(workspaceSlug, { start_date: startDate, end_date: endDate, summary: true }),
        service.workspaceWorkLogs(workspaceSlug, { start_date: startDate, end_date: endDate }),
      ]);
      setSummary(Array.isArray((sum as any)?.results) ? (sum as any).results : []);
      setRows(Array.isArray(list) ? (list as TIssueWorkLog[]) : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug]);

  const csv = useMemo(() => {
    const header = "date,person,issue,hours,description\n";
    const body = rows
      .map((r) =>
        [
          r.logged_at,
          JSON.stringify(r.actor_detail?.display_name || r.actor_detail?.email || ""),
          r.issue_identifier || "",
          (r.duration_minutes / 60).toFixed(2),
          JSON.stringify(r.description || ""),
        ].join(",")
      )
      .join("\n");
    return header + body;
  }, [rows]);

  const downloadCsv = () => {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `worklogs-${startDate}-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (workspaceUserInfo && !canView) {
    return <NotAuthorizedView section="settings" className="h-auto" />;
  }

  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Worklogs` : undefined;

  return (
    <SettingsContentWrapper hugging>
      <PageHead title={pageTitle} />
      <div className="flex w-full flex-col gap-y-6">
        <SettingsHeading title="Worklogs / کارکرد" description="جمع ساعت هر نفر و ریز لاگ‌های تسک‌ها" />

        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            از
            <input className="mt-1 block rounded border border-custom-border-200 bg-transparent px-2 py-1" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>
          <label className="text-sm">
            تا
            <input className="mt-1 block rounded border border-custom-border-200 bg-transparent px-2 py-1" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </label>
          <button className="rounded bg-custom-primary-100 px-3 py-1.5 text-sm text-white" onClick={load} disabled={loading}>
            {loading ? "…" : "اعمال"}
          </button>
          <button className="rounded border border-custom-border-200 px-3 py-1.5 text-sm" onClick={downloadCsv}>
            CSV
          </button>
        </div>

        <div className="overflow-hidden rounded-lg border border-custom-border-200">
          <table className="w-full text-sm">
            <thead className="bg-custom-background-90 text-custom-text-300">
              <tr>
                <th className="px-3 py-2 text-right">فرد</th>
                <th className="px-3 py-2 text-right">جمع ساعت</th>
              </tr>
            </thead>
            <tbody>
              {summary.length === 0 && (
                <tr>
                  <td className="px-3 py-3 text-custom-text-300" colSpan={2}>
                    در این بازه لاگی نیست
                  </td>
                </tr>
              )}
              {summary.map((r) => (
                <tr key={r.actor_id} className="border-t border-custom-border-200">
                  <td className="px-3 py-2">{r.display_name}</td>
                  <td className="px-3 py-2">{formatHours(r.total_minutes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="overflow-hidden rounded-lg border border-custom-border-200">
          <table className="w-full text-sm">
            <thead className="bg-custom-background-90 text-custom-text-300">
              <tr>
                <th className="px-3 py-2 text-right">تاریخ</th>
                <th className="px-3 py-2 text-right">فرد</th>
                <th className="px-3 py-2 text-right">تسک</th>
                <th className="px-3 py-2 text-right">ساعت</th>
                <th className="px-3 py-2 text-right">توضیح</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-custom-border-200">
                  <td className="px-3 py-2">{r.logged_at}</td>
                  <td className="px-3 py-2">{r.actor_detail?.display_name || r.actor_detail?.email}</td>
                  <td className="px-3 py-2">{r.issue_identifier}</td>
                  <td className="px-3 py-2">{formatHours(r.duration_minutes)}</td>
                  <td className="px-3 py-2">{r.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SettingsContentWrapper>
  );
}

export default observer(WorklogsPage);
