/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type { TPage } from "@plane/types";
import { APIService } from "@/services/api.service";

export class WorkspacePageService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchAll(workspaceSlug: string, params?: { parent?: string; root_only?: string }): Promise<TPage[]> {
    const q = new URLSearchParams();
    if (params?.parent) q.set("parent", params.parent);
    if (params?.root_only !== undefined) q.set("root_only", params.root_only);
    const qs = q.toString();
    const path = qs ? `/api/workspaces/${workspaceSlug}/pages/?${qs}` : `/api/workspaces/${workspaceSlug}/pages/`;
    return this.get(path).then((r) => r?.data);
  }

  async fetchById(workspaceSlug: string, pageId: string): Promise<TPage> {
    return this.get(`/api/workspaces/${workspaceSlug}/pages/${pageId}/`).then((r) => r?.data);
  }

  async create(workspaceSlug: string, data: Partial<TPage>): Promise<TPage> {
    return this.post(`/api/workspaces/${workspaceSlug}/pages/`, data).then((r) => r?.data);
  }

  async update(workspaceSlug: string, pageId: string, data: Partial<TPage>): Promise<TPage> {
    return this.patch(`/api/workspaces/${workspaceSlug}/pages/${pageId}/`, data).then((r) => r?.data);
  }

  async updateDescription(
    workspaceSlug: string,
    pageId: string,
    data: { description_html?: string; description_json?: object }
  ) {
    return this.patch(`/api/workspaces/${workspaceSlug}/pages/${pageId}/description/`, data).then((r) => r?.data);
  }

  async remove(workspaceSlug: string, pageId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/pages/${pageId}/`).then((r) => r?.data);
  }

  async archive(workspaceSlug: string, pageId: string) {
    return this.post(`/api/workspaces/${workspaceSlug}/pages/${pageId}/archive/`).then((r) => r?.data);
  }
}
