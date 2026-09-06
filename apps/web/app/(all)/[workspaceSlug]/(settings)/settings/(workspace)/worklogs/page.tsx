/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { Download, Timer } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { BarChart } from "@plane/propel/charts/bar-chart";
import { PieChart } from "@plane/propel/charts/pie-chart";
import { Button } from "@plane/propel/button";
import { Card, ECardSpacing } from "@plane/ui";
import { cn } from "@plane/utils";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { CountChip } from "@/components/common/count-chip";
import { HesarBackButton } from "@/components/common/hesar-back-button";
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

const PERSON_COLORS = ["#3F76FF", "#16A34A", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#EC4899"];

function formatHours(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (minutes <= 0) return "0h";
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

  const totalMinutesAll = useMemo(() => summary.reduce((a, r) => a + (r.total_minutes || 0), 0), [summary]);
  const selectedMinutes = useMemo(() => {
    if (selectedActor === "all") return totalMinutesAll;
    return summary.find((s) => s.actor_id === selectedActor)?.total_minutes || 0;
  }, [selectedActor, summary, totalMinutesAll]);

  const csv = useMemo(() => {
    const header = "date,person,issue,title,hours,description\n";
    const body = rows
      .map((r) =>
        [
          r.logged_at,
          JSON.stringify(r.actor_detail?.display_name || r.actor_detail?.email || ""),
          r.issue_identifier || "",
          JSON.stringify(r.issue_name || ""),
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
          title={
            <span className="flex items-center gap-2.5">
              <HesarBackButton fallbackHref={`/${workspaceSlug}`} />
              <span className="flex size-8 items-center justify-center rounded-md bg-accent-primary/10 text-accent-primary">
                <Timer className="size-4" />
              </span>
              داشبورد کارکرد
              {rows.length > 0 && <CountChip count={rows.length} className="h-5" />}
            </span>
          }
          description="ساعت کار اعضای تیم، بر اساس فرد و تگ. هر ثبت جدید روی تسک به جمع قبلی اضافه می‌شود."
          control={
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" size="lg" onClick={downloadCsv} disabled={rows.length === 0}>
                <Download className="size-3.5" />
                CSV
              </Button>
              <Button variant="primary" size="lg" onClick={load} disabled={loading}>
                {loading ? "در حال بارگذاری…" : "به‌روزرسانی"}
              </Button>
            </div>
          }
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card spacing={ECardSpacing.SM}>
            <p className="text-body-xs-regular text-tertiary">جمع کل بازه</p>
            <p className="mt-1 text-h3-medium text-primary tabular-nums">{formatHours(totalMinutesAll)}</p>
          </Card>
          <Card spacing={ECardSpacing.SM}>
            <p className="text-body-xs-regular text-tertiary">انتخاب‌شده</p>
            <p className="mt-1 text-h3-medium text-accent-primary tabular-nums">{formatHours(selectedMinutes)}</p>
          </Card>
          <Card spacing={ECardSpacing.SM}>
            <p className="text-body-xs-regular text-tertiary">تعداد افراد</p>
            <p className="mt-1 text-h3-medium text-primary tabular-nums">{summary.length}</p>
          </Card>
        </div>

        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-subtle bg-surface-1 p-3">
          <label className="space-y-1 text-body-xs-regular text-tertiary">
            از
            <input
              className="focus:border-accent-primary block rounded-md border border-subtle bg-surface-2 px-2.5 py-1.5 text-body-xs-regular text-primary outline-none"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          <label className="space-y-1 text-body-xs-regular text-tertiary">
            تا
            <input
              className="focus:border-accent-primary block rounded-md border border-subtle bg-surface-2 px-2.5 py-1.5 text-body-xs-regular text-primary outline-none"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>
          <Button variant="secondary" size="sm" onClick={load} disabled={loading}>
            اعمال فیلتر
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedActor("all")}
            className={cn(
              "rounded-full border px-3 py-1.5 text-body-xs-medium transition-colors",
              selectedActor === "all"
                ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
                : "hover:border-accent-primary/40 border-subtle bg-surface-1 text-secondary"
            )}
          >
            همه افراد
          </button>
          {summary.map((p, i) => (
            <button
              key={p.actor_id}
              type="button"
              onClick={() => setSelectedActor(p.actor_id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-body-xs-medium transition-colors",
                selectedActor === p.actor_id
                  ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
                  : "hover:border-accent-primary/40 border-subtle bg-surface-1 text-secondary"
              )}
            >
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: PERSON_COLORS[i % PERSON_COLORS.length] }}
              />
              {p.display_name}
              <span className="text-tertiary tabular-nums">({formatHours(p.total_minutes)})</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card spacing={ECardSpacing.SM} className="!p-4">
            <h3 className="mb-3 text-body-sm-medium text-primary">ساعت کار بر اساس افراد</h3>
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
                    fill: (payload: any) => payload.color || PERSON_COLORS[0],
                    textClassName: "",
                    showPercentage: false,
                    showTopBorderRadius: () => true,
                    showBottomBorderRadius: () => true,
                  },
                ]}
                xAxis={{ key: "name", label: "" }}
                yAxis={{ key: "hours", label: "ساعت" }}
                barSize={28}
                showTooltip
              />
            ) : (
              <p className="py-16 text-center text-body-xs-regular text-tertiary">در این بازه داده‌ای نیست</p>
            )}
          </Card>

          <Card spacing={ECardSpacing.SM} className="!p-4">
            <h3 className="mb-3 text-body-sm-medium text-primary">ساعت کار بر اساس تگ‌ها</h3>
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
                  <div className="w-full space-y-2.5">
                    {byLabel.map((g) => (
                      <div key={g.label_id} className="flex items-center justify-between gap-2 text-body-xs-regular">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <div className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: g.color }} />
                          <span className="truncate text-secondary">{g.name}</span>
                        </div>
                        <span className="shrink-0 text-primary tabular-nums">{formatHours(g.total_minutes)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="py-16 text-center text-body-xs-regular text-tertiary">تگی روی تسک‌های دارای لاگ نیست</p>
            )}
          </Card>
        </div>

        <Card spacing={ECardSpacing.SM} className="!overflow-hidden !p-0">
          <div className="border-b border-subtle px-4 py-3">
            <h3 className="text-body-sm-medium text-primary">جمع ساعت افراد</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-body-xs-regular">
              <thead className="bg-surface-2 text-tertiary">
                <tr>
                  <th className="px-4 py-2.5 text-start font-medium">فرد</th>
                  <th className="px-4 py-2.5 text-start font-medium">جمع ساعت</th>
                </tr>
              </thead>
              <tbody>
                {summary.length === 0 && (
                  <tr>
                    <td className="px-4 py-4 text-tertiary" colSpan={2}>
                      در این بازه لاگی نیست
                    </td>
                  </tr>
                )}
                {summary.map((r, i) => (
                  <tr key={r.actor_id} className="border-t border-subtle">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: PERSON_COLORS[i % PERSON_COLORS.length] }}
                        />
                        <span className="text-primary">{r.display_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-primary tabular-nums">{formatHours(r.total_minutes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card spacing={ECardSpacing.SM} className="!overflow-hidden !p-0">
          <div className="border-b border-subtle px-4 py-3">
            <h3 className="text-body-sm-medium text-primary">جزئیات ثبت‌ها</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-body-xs-regular">
              <thead className="bg-surface-2 text-tertiary">
                <tr>
                  <th className="px-4 py-2.5 text-start font-medium">تاریخ</th>
                  <th className="px-4 py-2.5 text-start font-medium">فرد</th>
                  <th className="px-4 py-2.5 text-start font-medium">تسک</th>
                  <th className="px-4 py-2.5 text-start font-medium">عنوان</th>
                  <th className="px-4 py-2.5 text-start font-medium">ساعت</th>
                  <th className="px-4 py-2.5 text-start font-medium">توضیح</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td className="px-4 py-4 text-tertiary" colSpan={6}>
                      ثبتی در این فیلتر نیست
                    </td>
                  </tr>
                )}
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-subtle hover:bg-surface-2/50">
                    <td className="px-4 py-2.5 whitespace-nowrap text-secondary">{r.logged_at}</td>
                    <td className="px-4 py-2.5 text-primary">
                      {r.actor_detail?.display_name || r.actor_detail?.email}
                    </td>
                    <td className="px-4 py-2.5">
                      {workspaceSlug && r.project && r.issue ? (
                        <Link
                          to={`/${workspaceSlug}/projects/${r.project}/issues/${r.issue}`}
                          className="font-medium text-accent-primary hover:underline"
                        >
                          {r.issue_identifier}
                        </Link>
                      ) : (
                        <span className="text-secondary">{r.issue_identifier}</span>
                      )}
                    </td>
                    <td className="max-w-[280px] truncate px-4 py-2.5 text-primary" title={r.issue_name || ""}>
                      {r.issue_name || "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="rounded bg-accent-primary/10 px-1.5 py-0.5 text-11 text-accent-primary tabular-nums">
                        {formatHours(r.duration_minutes)}
                      </span>
                    </td>
                    <td className="max-w-[220px] truncate px-4 py-2.5 text-tertiary" title={r.description || ""}>
                      {r.description || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </SettingsContentWrapper>
  );
}

export default observer(WorklogsPage);
