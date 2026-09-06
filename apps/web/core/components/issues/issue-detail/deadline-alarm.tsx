/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { ToggleSwitch } from "@plane/ui";
import { cn } from "@plane/utils";
import {
  cancelLocalAlarm,
  enableWebPush,
  scheduleLocalAlarm,
  webPushService,
  type TIssueUserAlarm,
} from "@/services/web-push.service";
import { issueAlarmsStore } from "@/store/issue-alarms.store";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueName: string;
  issueIdentifier: string;
  targetDate: string | null;
  disabled?: boolean;
};

export function IssueDeadlineAlarmControl(props: Props) {
  const { workspaceSlug, projectId, issueId, issueName, issueIdentifier, targetDate, disabled } = props;
  const [alarm, setAlarm] = useState<TIssueUserAlarm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await webPushService.getIssueAlarm(workspaceSlug, projectId, issueId);
      setAlarm(data);
      issueAlarmsStore.setEnabled(issueId, !!data.enabled && !!data.fire_at);
    } catch {
      setAlarm(null);
    } finally {
      setLoading(false);
    }
  }, [workspaceSlug, projectId, issueId]);

  useEffect(() => {
    void load();
  }, [load]);

  const persist = async (next: Partial<TIssueUserAlarm>) => {
    if (!alarm) return;
    setSaving(true);
    try {
      await enableWebPush();
      const saved = await webPushService.putIssueAlarm(workspaceSlug, projectId, issueId, {
        ...alarm,
        ...next,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || alarm.timezone || "UTC",
      });
      setAlarm(saved);
      issueAlarmsStore.setEnabled(issueId, !!saved.enabled && !!saved.fire_at);
      const tag = `alarm-${issueId}`;
      if (saved.enabled && saved.fire_at) {
        await scheduleLocalAlarm({
          tag,
          title: "زنگ ددلاین",
          body: `${issueIdentifier} · ${issueName}`,
          url: `/${workspaceSlug}/projects/${projectId}/issues/${issueId}`,
          fireAtMs: new Date(saved.fire_at).getTime(),
        });
      } else {
        await cancelLocalAlarm(tag);
      }
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "زنگ",
        message: saved.enabled ? "زنگ ددلاین ذخیره شد." : "زنگ خاموش شد.",
      });
    } catch (e: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "خطا",
        message: e?.error || e?.message || "ذخیره زنگ نشد.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !alarm) return null;

  return (
    <div className={cn("mt-1 w-full rounded-md border border-subtle bg-surface-2/40 p-2", disabled && "opacity-60")}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-12 font-medium text-secondary">
          <Bell className="size-3.5" />
          زنگ ددلاین
        </div>
        <ToggleSwitch
          value={alarm.enabled}
          disabled={disabled || saving || !targetDate}
          onChange={(v) => void persist({ enabled: v })}
          size="sm"
        />
      </div>
      {!targetDate && <p className="text-11 text-tertiary">اول ددلاین را مشخص کن.</p>}
      {targetDate && (
        <div className="space-y-1.5">
          <select
            className="w-full rounded border border-subtle bg-surface-1 px-2 py-1 text-12 text-primary"
            disabled={disabled || saving || !alarm.enabled}
            value={alarm.mode}
            onChange={(e) =>
              void persist({
                mode: e.target.value as TIssueUserAlarm["mode"],
                enabled: alarm.enabled,
              })
            }
          >
            <option value="at_time_on_due_date">ساعت مشخص در روز ددلاین</option>
            <option value="hours_before">چند ساعت قبل از پایان روز ددلاین</option>
          </select>
          {alarm.mode === "at_time_on_due_date" ? (
            <input
              type="time"
              className="w-full rounded border border-subtle bg-surface-1 px-2 py-1 text-12 text-primary"
              disabled={disabled || saving || !alarm.enabled}
              value={alarm.time_local || "09:00"}
              onChange={(e) => void persist({ time_local: e.target.value, enabled: alarm.enabled })}
            />
          ) : (
            <input
              type="number"
              min={0}
              max={168}
              className="w-full rounded border border-subtle bg-surface-1 px-2 py-1 text-12 text-primary"
              disabled={disabled || saving || !alarm.enabled}
              value={alarm.hours_before ?? 2}
              onChange={(e) => void persist({ hours_before: Number(e.target.value) || 0, enabled: alarm.enabled })}
            />
          )}
          <p className="text-[10px] text-tertiary">
            می‌تونی روی مک ست کنی؛ یک‌بار موبایل را آنلاین باز کن تا زنگ‌ها همگام شوند، بعد آفلاین هم در همان زمان روی گوشی
            زنگ می‌زند (Chrome/Android بهترین پشتیبانی را دارد). اول روی موبایل «فعال‌سازی» Web Push را بزن.
          </p>
        </div>
      )}
    </div>
  );
}
