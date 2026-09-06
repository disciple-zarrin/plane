/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type { TPageVersion } from "@plane/types";
import { APIService } from "@/services/api.service";

export class WorkspacePageVersionService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchAllVersions(workspaceSlug: string, pageId: string): Promise<TPageVersion[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/pages/${pageId}/versions/`).then((r) => r?.data);
  }

  async fetchVersionById(workspaceSlug: string, pageId: string, versionId: string): Promise<TPageVersion> {
    return this.get(`/api/workspaces/${workspaceSlug}/pages/${pageId}/versions/${versionId}/`).then((r) => r?.data);
  }

  async restoreVersion(
    workspaceSlug: string,
    pageId: string,
    versionId: string
  ): Promise<{ description_html: string }> {
    return this.post(`/api/workspaces/${workspaceSlug}/pages/${pageId}/versions/${versionId}/restore/`).then(
      (r) => r?.data
    );
  }
}
