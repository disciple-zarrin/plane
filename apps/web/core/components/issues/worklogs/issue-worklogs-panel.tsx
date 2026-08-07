/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useMemo, useState } from "react"
import { observer } from "mobx-react"
import { Timer } from "lucide-react"
import { Button } from "@plane/propel/button"
// components
import { SidebarPropertyListItem } from "@/components/common/layout/sidebar/property-list-item"
import { WorkLogService, type TIssueWorkLog } from "@/services/worklog.service"

type Props = {
  workspaceSlug: string
  projectId: string
  issueId: string
  disabled?: boolean
}

const service = new WorkLogService()

function formatHours(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h <= 0) return `${m}m`
  if (m <= 0) return `${h}h`
  return `${h}h ${m}m`
}

export const IssueWorklogsPanel = observer(function IssueWorklogsPanel(props: Props) {
  const { workspaceSlug, projectId, issueId, disabled } = props
  const [logs, setLogs] = useState<TIssueWorkLog[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [hours, setHours] = useState("1")
  const [minutes, setMinutes] = useState("0")
  const [description, setDescription] = useState("")
  const [loggedAt, setLoggedAt] = useState(() => new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await service.listIssueWorkLogs(workspaceSlug, projectId, issueId)
      setLogs(Array.isArray(data) ? data : [])
    } catch {
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [workspaceSlug, projectId, issueId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const totalMinutes = useMemo(() => logs.reduce((acc, l) => acc + (l.duration_minutes || 0), 0), [logs])

  const onSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await service.createIssueWorkLog(workspaceSlug, projectId, issueId, {
        hours: Number(hours) || 0,
        minutes: Number(minutes) || 0,
        description,
        logged_at: loggedAt,
      })
      setOpen(false)
      setDescription("")
      setHours("1")
      setMinutes("0")
      await refresh()
    } catch {
      setError("ثبت نشد. دوباره تلاش کنید.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-2">
      <SidebarPropertyListItem icon={Timer} label="زمان صرف‌شده">
        <div className="flex w-full items-center justify-between gap-2">
          <span className="text-body-xs-medium">{loading ? "…" : formatHours(totalMinutes)}</span>
          {!disabled && (
            <Button variant="secondary" size="sm" onClick={() => setOpen((v) => !v)}>
              ثبت ساعت
            </Button>
          )}
        </div>
      </SidebarPropertyListItem>

      {open && !disabled && (
        <div className="rounded-md border border-custom-border-200 bg-custom-background-100 p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-custom-text-300">
              ساعت
              <input
                className="mt-1 w-full rounded border border-custom-border-200 bg-transparent px-2 py-1 text-sm"
                type="number"
                min={0}
                step={1}
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            </label>
            <label className="text-xs text-custom-text-300">
              دقیقه
              <input
                className="mt-1 w-full rounded border border-custom-border-200 bg-transparent px-2 py-1 text-sm"
                type="number"
                min={0}
                max={59}
                step={15}
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
              />
            </label>
          </div>
          <label className="block text-xs text-custom-text-300">
            تاریخ
            <input
              className="mt-1 w-full rounded border border-custom-border-200 bg-transparent px-2 py-1 text-sm"
              type="date"
              value={loggedAt}
              onChange={(e) => setLoggedAt(e.target.value)}
            />
          </label>
          <label className="block text-xs text-custom-text-300">
            توضیح
            <textarea
              className="mt-1 w-full rounded border border-custom-border-200 bg-transparent px-2 py-1 text-sm"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={onSave} disabled={saving}>
              ذخیره
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
              انصراف
            </Button>
          </div>
        </div>
      )}

      {logs.length > 0 && (
        <div className="rounded-md border border-custom-border-200 p-2 space-y-1 max-h-40 overflow-auto">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start justify-between gap-2 text-xs text-custom-text-200">
              <div>
                <div className="font-medium text-custom-text-100">
                  {log.actor_detail?.display_name || log.actor_detail?.email || "—"} · {formatHours(log.duration_minutes)}
                </div>
                <div>
                  {log.logged_at}
                  {log.description ? ` — ${log.description}` : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
})
