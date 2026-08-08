/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import { APIService } from "@/services/api.service";

export type TExportTreePage = {
  id: string;
  name: string;
  parent: string | null;
  description_html: string;
  description_json: object;
  children_ids: string[];
  bookmark_id: string;
};

export type TExportTree = {
  root: string;
  pages: TExportTreePage[];
  truncated?: boolean;
};

export class PageExportService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchProjectTree(workspaceSlug: string, projectId: string, pageId: string): Promise<TExportTree> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/export-tree/`
    ).then((r) => r?.data);
  }

  async fetchWikiTree(workspaceSlug: string, pageId: string): Promise<TExportTree> {
    return this.get(`/api/workspaces/${workspaceSlug}/pages/${pageId}/export-tree/`).then((r) => r?.data);
  }
}
