/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { Bell } from "lucide-react";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { ToggleSwitch } from "@plane/ui";
import {
  cancelLocalAlarm,
  scheduleLocalAlarm,
  syncPendingAlarmsFromServer,
  webPushService,
  type TPendingIssueAlarm,
} from "@/services/web-push.service";
import { issueAlarmsStore } from "@/store/issue-alarms.store";

function formatFireAt(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("fa-IR", {
      calendar: "persian",
      weekday: "short",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return iso;
  }
}

type Props = {
  /** Home page uses a tighter card that matches widget spacing. */
  variant?: "settings" | "home";
};

export function UpcomingAlarmsList({ variant = "settings" }: Props) {
  const [alarms, setAlarms] = useState<TPendingIssueAlarm[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const results = await webPushService.listMyPendingAlarms();
      setAlarms(results);
      await syncPendingAlarmsFromServer();
    } catch {
      setAlarms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = async (alarm: TPendingIssueAlarm, enabled: boolean) => {
    if (!alarm.issue_id) return;
    setBusyId(alarm.issue_id);
    try {
      const saved = await webPushService.putIssueAlarm(alarm.workspace_slug, alarm.project_id, alarm.issue_id, {
        enabled,
        mode: alarm.mode,
        time_local: alarm.time_local,
        hours_before: alarm.hours_before,
        timezone: alarm.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      });
      const tag = `alarm-${alarm.issue_id}`;
      if (saved.enabled && saved.fire_at) {
        await scheduleLocalAlarm({
          tag,
          title: "زنگ ددلاین",
          body: `${alarm.issue_identifier} · ${alarm.issue_name}`,
          url: alarm.url,
          fireAtMs: new Date(saved.fire_at).getTime(),
        });
      } else {
        await cancelLocalAlarm(tag);
      }
      issueAlarmsStore.setEnabled(alarm.issue_id, !!saved.enabled && !!saved.fire_at);
      setAlarms((prev) =>
        prev.map((row) =>
          row.issue_id === alarm.issue_id
            ? {
                ...row,
                ...saved,
                issue_id: alarm.issue_id,
                project_id: alarm.project_id,
                workspace_slug: alarm.workspace_slug,
                issue_name: alarm.issue_name,
                issue_identifier: alarm.issue_identifier,
                url: alarm.url,
              }
            : row
        )
      );
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "زنگ",
        message: enabled ? "زنگ روشن شد." : "زنگ خاموش شد.",
      });
    } catch (e: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "خطا",
        message: e?.error || e?.message || "تغییر زنگ نشد.",
      });
    } finally {
      setBusyId(null);
    }
  };

  const isHome = variant === "home";

  return (
    <div
      className={
        isHome
          ? "rounded-md border border-subtle bg-surface-2/30 p-3"
          : "mt-6 rounded-md border border-subtle bg-surface-1/40 p-3"
      }
    >
      <div className="mb-2 flex items-center gap-1.5 text-13 font-medium text-primary">
        <Bell className="size-3.5" />
        زنگ‌های پیش‌رو
      </div>
      {!isHome && (
        <p className="mb-3 text-11 text-tertiary">
          زنگ‌هایی که برای تسک‌ها ست کرده‌ای. از اینجا روشن/خاموش کن؛ با باز کردن صفحه روی موبایل همگام می‌شوند.
        </p>
      )}
      {loading ? (
        <p className="text-12 text-tertiary">در حال بارگذاری…</p>
      ) : alarms.length === 0 ? (
        <p className="text-12 text-tertiary">زنگ پیش‌رویی نیست. از داخل تسک، «زنگ ددلاین» را روشن کن.</p>
      ) : (
        <ul className="divide-y divide-subtle">
          {alarms.map((alarm) => (
            <li key={alarm.issue_id} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <Link
                  to={alarm.url}
                  className="block truncate text-12 font-medium text-primary hover:underline"
                >
                  {alarm.issue_identifier} · {alarm.issue_name}
                </Link>
                <p className="text-11 text-tertiary">{formatFireAt(alarm.fire_at)}</p>
              </div>
              <ToggleSwitch
                value={!!alarm.enabled}
                disabled={busyId === alarm.issue_id}
                onChange={(v) => void toggle(alarm, v)}
                size="sm"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
