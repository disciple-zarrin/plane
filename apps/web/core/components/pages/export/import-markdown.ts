/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { v4 as uuidv4 } from "uuid";
import { convertBinaryDataToBase64String, getBinaryDataFromDocumentEditorHTMLString } from "@plane/editor";
import { EFileAssetType } from "@plane/types";
import type { TPage } from "@plane/types";
import { parseMarkdownZip, topoSortParsedPages } from "@/components/pages/export/markdown-zip";
import { FileService } from "@/services/file.service";
import { ProjectPageService } from "@/services/page/project-page.service";
import { WorkspacePageService } from "@/services/page/workspace-page.service";

export type TMarkdownImportResult = {
  created: number;
  failed: number;
  errors: string[];
};

type TUploadFn = (args: {
  blockId: string;
  file: File;
  pageId: string;
}) => Promise<string>;

type TCreatePageFn = (args: {
  name: string;
  parent: string;
  description_html: string;
}) => Promise<{ id: string }>;

type TUpdateDescriptionFn = (pageId: string, html: string) => Promise<void>;

type TDeletePageFn = (pageId: string) => Promise<void>;

function toDocumentPayload(html: string) {
  const safeHtml = html?.trim() ? html : "<p></p>";
  const binary = getBinaryDataFromDocumentEditorHTMLString(safeHtml);
  return {
    description_html: safeHtml,
    description_binary: convertBinaryDataToBase64String(binary),
    description_json: {},
  };
}

async function importParsedPages(args: {
  file: File;
  destinationPageId: string;
  createPage: TCreatePageFn;
  updateDescription: TUpdateDescriptionFn;
  uploadAsset: TUploadFn;
  deletePage: TDeletePageFn;
}): Promise<TMarkdownImportResult> {
  const { file, destinationPageId, createPage, updateDescription, uploadAsset, deletePage } = args;
  const parsed = await parseMarkdownZip(file);
  const ordered = topoSortParsedPages(parsed);
  const idMap = new Map<string, string>();
  const result: TMarkdownImportResult = { created: 0, failed: 0, errors: [] };

  for (const page of ordered) {
    let createdId: string | undefined;
    let wroteContentOnCreate = false;
    try {
      const oldParent = page.parent;
      const parentId =
        oldParent && idMap.has(oldParent) ? (idMap.get(oldParent) as string) : destinationPageId;

      let html = page.html?.trim() ? page.html : "<p></p>";
      wroteContentOnCreate = html !== "<p></p>";

      // Create WITH content so wiki HTML is never empty if binary update fails.
      const created = await createPage({
        name: page.title,
        parent: parentId,
        description_html: html,
      });
      createdId = created.id;

      for (const asset of page.assets) {
        const blob = new Blob([asset.bytes], { type: asset.mime });
        const fileObj = new File([blob], asset.name, { type: asset.mime });
        const assetId = await uploadAsset({
          blockId: uuidv4(),
          file: fileObj,
          pageId: created.id,
        });
        html = html.split(asset.placeholder).join(assetId);
      }

      await updateDescription(created.id, html);
      if (page.id) idMap.set(page.id, created.id);
      result.created += 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : typeof e === "string" ? e : "unknown";
      if (createdId && wroteContentOnCreate) {
        // Keep the page — content is already on create.
        if (page.id) idMap.set(page.id, createdId);
        result.created += 1;
        result.errors.push(`${page.title}: هشدار آپدیت — ${msg}`);
      } else {
        if (createdId) {
          try {
            await deletePage(createdId);
          } catch {
            /* best-effort */
          }
        }
        result.failed += 1;
        result.errors.push(`${page.title}: ${msg}`);
      }
    }
  }

  return result;
}

const workspacePageService = new WorkspacePageService();
const projectPageService = new ProjectPageService();
const fileService = new FileService();

/** Import a Markdown(+assets) ZIP under a wiki (workspace) page. */
export async function importMarkdownZipToWiki(args: {
  file: File;
  workspaceSlug: string;
  destinationPageId: string;
}): Promise<TMarkdownImportResult> {
  const { file, workspaceSlug, destinationPageId } = args;
  return importParsedPages({
    file,
    destinationPageId,
    createPage: async ({ name, parent, description_html }) => {
      const page = await workspacePageService.create(workspaceSlug, {
        name,
        parent,
        description_html,
      } as Partial<TPage> & { description_html?: string });
      return { id: page.id };
    },
    updateDescription: async (pageId, html) => {
      const payload = toDocumentPayload(html);
      await workspacePageService.updateDescription(workspaceSlug, pageId, payload);
    },
    deletePage: async (pageId) => {
      await workspacePageService.remove(workspaceSlug, pageId);
    },
    uploadAsset: async ({ blockId: _blockId, file: f, pageId }) => {
      const res = await fileService.uploadWorkspaceAsset(
        workspaceSlug,
        {
          entity_identifier: pageId,
          entity_type: EFileAssetType.PAGE_DESCRIPTION,
        },
        f
      );
      return res.asset_id;
    },
  });
}

/** Import a Markdown(+assets) ZIP under a project page. */
export async function importMarkdownZipToProject(args: {
  file: File;
  workspaceSlug: string;
  projectId: string;
  destinationPageId: string;
}): Promise<TMarkdownImportResult> {
  const { file, workspaceSlug, projectId, destinationPageId } = args;
  return importParsedPages({
    file,
    destinationPageId,
    createPage: async ({ name, parent, description_html }) => {
      const page = await projectPageService.create(workspaceSlug, projectId, {
        name,
        parent,
        description_html,
      } as Partial<TPage> & { description_html?: string });
      return { id: page.id };
    },
    updateDescription: async (pageId, html) => {
      await projectPageService.updateDescription(workspaceSlug, projectId, pageId, toDocumentPayload(html));
    },
    deletePage: async (pageId) => {
      await projectPageService.remove(workspaceSlug, projectId, pageId);
    },
    uploadAsset: async ({ file: f, pageId }) => {
      const res = await fileService.uploadProjectAsset(
        workspaceSlug,
        projectId,
        {
          entity_identifier: pageId,
          entity_type: EFileAssetType.PAGE_DESCRIPTION,
        },
        f
      );
      return res.asset_id;
    },
  });
}
