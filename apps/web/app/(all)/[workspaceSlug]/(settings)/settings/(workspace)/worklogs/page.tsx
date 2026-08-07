/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useParams, useSearchParams } from "react-router";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { BarChart } from "@plane/propel/charts/bar-chart";
import { PieChart } from "@plane/propel/charts/pie-chart";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
import {
  WorkLogService,
  type TIssueWorkLog,
  type TWorkLogLabelRow,
  type TWorkLogSummaryResponse,
  type TWorkLogSummaryRow,
} from "@/services/worklog.service";

const service = new WorkLogService();

const PERSON_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];

function formatHours(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h <= 0) return `${m}m`;
  if (m <= 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function WorklogsPage() {
  const { workspaceSlug } = useParams();
  const [searchParams] = useSearchParams();
  const projectFromQuery = searchParams.get("project_id") || "";

  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const canView = allowPermissions([EUserPermissions.ADMIN, EUserPermissions.MEMBER], EUserPermissionsLevel.WORKSPACE);

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [projectId, setProjectId] = useState(projectFromQuery);
  const [selectedActor, setSelectedActor] = useState<string>("all");
  const [summary, setSummary] = useState<TWorkLogSummaryRow[]>([]);
  const [byLabel, setByLabel] = useState<TWorkLogLabelRow[]>([]);
  const [rows, setRows] = useState<TIssueWorkLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (projectFromQuery) setProjectId(projectFromQuery);
  }, [projectFromQuery]);

  const load = async () => {
    if (!workspaceSlug) return;
    setLoading(true);
    try {
      const base = {
        start_date: startDate,
        end_date: endDate,
        project_id: projectId || undefined,
      };
      const [sum, list] = await Promise.all([
        service.workspaceWorkLogs(workspaceSlug, { ...base, summary: true }),
        service.workspaceWorkLogs(workspaceSlug, {
          ...base,
          actor_id: selectedActor !== "all" ? selectedActor : undefined,
        }),
      ]);
      const summaryData = sum as TWorkLogSummaryResponse;
      const people = summaryData.by_person || summaryData.results || [];
      setSummary(people);
      setByLabel(summaryData.by_label || []);
      setRows(Array.isArray(list) ? (list as TIssueWorkLog[]) : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug, selectedActor, projectId]);

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

  const personChartData = summary.map((r, i) => ({
    key: r.actor_id,
    name: r.display_name,
    hours: Number((r.total_minutes / 60).toFixed(2)),
    color: PERSON_COLORS[i % PERSON_COLORS.length],
  }));

  const labelChartData = byLabel.map((r) => ({
    id: r.label_id,
    key: r.label_id,
    value: Number((r.total_minutes / 60).toFixed(2)),
    name: r.name,
    color: r.color || "#94a3b8",
  }));

  if (workspaceUserInfo && !canView) {
    return <NotAuthorizedView section="settings" className="h-auto" />;
  }

  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - کارکرد` : undefined;

  return (
    <SettingsContentWrapper hugging>
      <PageHead title={pageTitle} />
      <div className="flex w-full flex-col gap-y-6">
        <SettingsHeading
          title="داشبورد کارکرد"
          description="مدیر می‌تواند ساعت همه افراد را ببیند؛ با تب افراد جابه‌جا شوید. نمودار تگ‌ها و نفرها اینجاست."
        />

        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            از
            <input
              className="mt-1 block rounded border border-custom-border-200 bg-transparent px-2 py-1"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          <label className="text-sm">
            تا
            <input
              className="mt-1 block rounded border border-custom-border-200 bg-transparent px-2 py-1"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>
          <button
            className="rounded bg-custom-primary-100 px-3 py-1.5 text-sm text-white"
            onClick={load}
            disabled={loading}
          >
            {loading ? "…" : "اعمال فیلتر"}
          </button>
          <button className="rounded border border-custom-border-200 px-3 py-1.5 text-sm" onClick={downloadCsv}>
            CSV
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedActor("all")}
            className={`rounded-full border px-3 py-1 text-sm ${
              selectedActor === "all"
                ? "border-custom-primary-100 bg-custom-primary-100/10 text-custom-primary-100"
                : "border-custom-border-200"
            }`}
          >
            همه افراد
          </button>
          {summary.map((p) => (
            <button
              key={p.actor_id}
              type="button"
              onClick={() => setSelectedActor(p.actor_id)}
              className={`rounded-full border px-3 py-1 text-sm ${
                selectedActor === p.actor_id
                  ? "border-custom-primary-100 bg-custom-primary-100/10 text-custom-primary-100"
                  : "border-custom-border-200"
              }`}
            >
              {p.display_name} ({formatHours(p.total_minutes)})
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-custom-border-200 p-4">
            <h3 className="mb-3 text-sm font-medium">ساعت کار بر اساس افراد</h3>
            {personChartData.length > 0 ? (
              <BarChart
                className="h-[280px] w-full"
                margin={{ top: 10, right: 10, bottom: 5, left: 0 }}
                data={personChartData}
                bars={[
                  {
                    key: "hours",
                    label: "ساعت",
                    stackId: "h",
                    fill: (payload: any) => payload.color || "#3b82f6",
                    textClassName: "",
                    showPercentage: false,
                  },
                ]}
                xAxis={{ key: "name", label: "" }}
                yAxis={{ key: "hours", label: "ساعت" }}
                showTooltip
              />
            ) : (
              <p className="text-sm text-custom-text-300">در این بازه داده‌ای نیست</p>
            )}
          </div>

          <div className="rounded-lg border border-custom-border-200 p-4">
            <h3 className="mb-3 text-sm font-medium">ساعت کار بر اساس تگ‌ها</h3>
            {labelChartData.length > 0 ? (
              <div className="grid h-[280px] grid-cols-1 gap-2 md:grid-cols-2">
                <PieChart
                  className="size-full"
                  dataKey="value"
                  data={labelChartData}
                  cells={labelChartData.map((g) => ({ key: g.key, fill: g.color }))}
                  showTooltip
                  tooltipLabel="ساعت"
                  paddingAngle={3}
                  cornerRadius={4}
                  innerRadius="45%"
                  showLabel={false}
                  margin={{ top: 0, right: -10, bottom: 0, left: -10 }}
                />
                <div className="flex items-center">
                  <div className="w-full space-y-2">
                    {byLabel.map((g) => (
                      <div key={g.label_id} className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5">
                          <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: g.color }} />
                          <span>{g.name}</span>
                        </div>
                        <span>{formatHours(g.total_minutes)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-custom-text-300">تگی روی تسک‌های دارای لاگ نیست</p>
            )}
          </div>
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
