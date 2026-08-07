/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants"
import { APIService } from "@/services/api.service"

export type TIssueWorkLog = {
  id: string
  workspace: string
  project: string
  project_identifier?: string
  issue: string
  issue_identifier?: string
  issue_name?: string
  actor: string
  actor_detail?: {
    id: string
    display_name?: string
    email?: string
    first_name?: string
    last_name?: string
  }
  duration_minutes: number
  duration_hours?: number
  description: string
  logged_at: string
  created_at: string
}

export type TWorkLogSummaryRow = {
  actor_id: string
  display_name: string
  email?: string
  total_minutes: number
  total_hours: number
}

export type TWorkLogLabelRow = {
  label_id: string
  name: string
  color: string
  total_minutes: number
  total_hours: number
}

export type TWorkLogSummaryResponse = {
  results: TWorkLogSummaryRow[]
  by_person?: TWorkLogSummaryRow[]
  by_label?: TWorkLogLabelRow[]
}

export class WorkLogService extends APIService {
  constructor() {
    super(API_BASE_URL)
  }

  async listIssueWorkLogs(workspaceSlug: string, projectId: string, issueId: string): Promise<TIssueWorkLog[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/worklogs/`).then(
      (res) => res?.data
    )
  }

  async createIssueWorkLog(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: { hours?: number; minutes?: number; duration_minutes?: number; description?: string; logged_at?: string }
  ): Promise<TIssueWorkLog> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/worklogs/`, data).then(
      (res) => res?.data
    )
  }

  async deleteIssueWorkLog(workspaceSlug: string, projectId: string, issueId: string, worklogId: string): Promise<void> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/worklogs/${worklogId}/`
    ).then((res) => res?.data)
  }

  async issueSummary(workspaceSlug: string, projectId: string, issueId: string) {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/worklogs-summary/`
    ).then((res) => res?.data)
  }

  async workspaceWorkLogs(
    workspaceSlug: string,
    params?: { project_id?: string; actor_id?: string; start_date?: string; end_date?: string; summary?: boolean }
  ): Promise<TIssueWorkLog[] | TWorkLogSummaryResponse> {
    const q = new URLSearchParams()
    if (params?.project_id) q.set("project_id", params.project_id)
    if (params?.actor_id) q.set("actor_id", params.actor_id)
    if (params?.start_date) q.set("start_date", params.start_date)
    if (params?.end_date) q.set("end_date", params.end_date)
    if (params?.summary) q.set("summary", "1")
    const qs = q.toString()
    const path = qs
      ? `/api/workspaces/${workspaceSlug}/worklogs/?${qs}`
      : `/api/workspaces/${workspaceSlug}/worklogs/`
    return this.get(path).then((res) => res?.data)
  }
}
