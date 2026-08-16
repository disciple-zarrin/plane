/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import { APIService } from "@/services/api.service";
import { issueAlarmsStore } from "@/store/issue-alarms.store";

export type TIssueUserAlarm = {
  id?: string;
  enabled: boolean;
  mode: "at_time_on_due_date" | "hours_before";
  time_local: string;
  hours_before: number | null;
  timezone: string;
  fire_at: string | null;
  fired_at: string | null;
};

export type TPendingIssueAlarm = TIssueUserAlarm & {
  issue_id: string;
  project_id: string;
  workspace_slug: string;
  issue_name: string;
  issue_identifier: string;
  url: string;
};

export class WebPushService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getVapidPublicKey(): Promise<{ configured: boolean; public_key: string }> {
    return this.get(`/api/users/me/web-push/vapid-public-key/`)
      .then((r) => r?.data)
      .catch((e) => {
        throw e?.response?.data;
      });
  }

  async saveSubscription(subscription: PushSubscriptionJSON): Promise<{ id: string; endpoint: string }> {
    return this.post(`/api/users/me/web-push-subscriptions/`, subscription)
      .then((r) => r?.data)
      .catch((e) => {
        throw e?.response?.data;
      });
  }

  async deleteSubscription(endpoint?: string): Promise<{ deleted: number }> {
    return this.delete(`/api/users/me/web-push-subscriptions/`, endpoint ? { endpoint } : undefined)
      .then((r) => r?.data)
      .catch((e) => {
        throw e?.response?.data;
      });
  }

  async getIssueAlarm(workspaceSlug: string, projectId: string, issueId: string): Promise<TIssueUserAlarm> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/my-alarm/`)
      .then((r) => r?.data)
      .catch((e) => {
        throw e?.response?.data;
      });
  }

  async putIssueAlarm(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<TIssueUserAlarm>
  ): Promise<TIssueUserAlarm> {
    return this.put(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/my-alarm/`, data)
      .then((r) => r?.data)
      .catch((e) => {
        throw e?.response?.data;
      });
  }

  async listMyPendingAlarms(): Promise<TPendingIssueAlarm[]> {
    return this.get(`/api/users/me/issue-alarms/`)
      .then((r) => (r?.data?.results as TPendingIssueAlarm[]) || [])
      .catch((e) => {
        throw e?.response?.data;
      });
  }
}

export const webPushService = new WebPushService();

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export async function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    const existing = await navigator.serviceWorker.getRegistration("/");
    if (existing) return existing;
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch {
    return null;
  }
}

export async function enableWebPush(): Promise<boolean> {
  const reg = await ensureServiceWorker();
  if (!reg) return false;
  if (!("PushManager" in window) || !("Notification" in window)) return false;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  const { configured, public_key } = await webPushService.getVapidPublicKey();
  if (!configured || !public_key) return false;

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(public_key),
  });
  await webPushService.saveSubscription(sub.toJSON());
  // After this device is push-ready, pull alarms set elsewhere (e.g. Mac).
  void syncPendingAlarmsFromServer();
  return true;
}

export async function scheduleLocalAlarm(params: {
  tag: string;
  title: string;
  body: string;
  url: string;
  fireAtMs: number;
}) {
  const reg = await ensureServiceWorker();
  if (!reg) return false;
  await navigator.serviceWorker.ready;
  const worker = reg.active || (await navigator.serviceWorker.ready).active;
  if (!worker) return false;

  worker.postMessage({ type: "SCHEDULE_ALARM", ...params });

  // Ask browser to periodically wake SW so IndexedDB alarms can fire offline.
  try {
    const anyReg = reg as ServiceWorkerRegistration & {
      periodicSync?: { register: (tag: string, opts: { minInterval: number }) => Promise<void> };
    };
    if (anyReg.periodicSync) {
      await anyReg.periodicSync.register("hesar-deadline-alarms", {
        minInterval: 15 * 60 * 1000,
      });
    }
  } catch {
    /* unsupported / permission */
  }

  try {
    const syncManager = (reg as ServiceWorkerRegistration & { sync?: { register: (tag: string) => Promise<void> } })
      .sync;
    if (syncManager) await syncManager.register("hesar-deadline-alarms");
  } catch {
    /* unsupported */
  }

  return true;
}

export async function cancelLocalAlarm(tag: string) {
  const reg = await ensureServiceWorker();
  if (!reg) return false;
  await navigator.serviceWorker.ready;
  const worker = reg.active || (await navigator.serviceWorker.ready).active;
  if (!worker) return false;
  worker.postMessage({ type: "CANCEL_ALARM", tag });
  return true;
}

/** Call on app focus to catch overdue alarms after being offline. */
export async function flushLocalAlarms() {
  const reg = await ensureServiceWorker();
  if (!reg) return;
  await navigator.serviceWorker.ready;
  const worker = reg.active || (await navigator.serviceWorker.ready).active;
  worker?.postMessage({ type: "FLUSH_ALARMS" });
}

/**
 * Pull alarms saved on any device (e.g. Mac) and schedule them on this device.
 * Call when mobile comes online so later offline rings still work.
 */
export async function syncPendingAlarmsFromServer(): Promise<number> {
  if (typeof window === "undefined" || !navigator.onLine) return 0;
  try {
    const pending = await webPushService.listMyPendingAlarms();
    const enabledIds = pending.filter((a) => a.enabled && a.issue_id).map((a) => a.issue_id);
    issueAlarmsStore.replaceAll(enabledIds);
    let n = 0;
    for (const alarm of pending) {
      if (!alarm.enabled || !alarm.fire_at || !alarm.issue_id) continue;
      const fireAtMs = new Date(alarm.fire_at).getTime();
      if (!Number.isFinite(fireAtMs)) continue;
      await scheduleLocalAlarm({
        tag: `alarm-${alarm.issue_id}`,
        title: "زنگ ددلاین",
        body: `${alarm.issue_identifier} · ${alarm.issue_name}`,
        url: alarm.url || `/${alarm.workspace_slug}/projects/${alarm.project_id}/issues/${alarm.issue_id}`,
        fireAtMs,
      });
      n += 1;
    }
    await flushLocalAlarms();
    return n;
  } catch {
    return 0;
  }
}
