/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Node } from "@tiptap/core";

export enum ESyncedBlockAttributeNames {
  SYNC_ID = "data-sync-id",
  SOURCE_PAGE_ID = "data-source-page-id",
  SOURCE_PAGE_TITLE = "data-source-page-title",
}

export type TSyncedBlockAttributes = {
  [ESyncedBlockAttributeNames.SYNC_ID]: string;
  [ESyncedBlockAttributeNames.SOURCE_PAGE_ID]?: string;
  [ESyncedBlockAttributeNames.SOURCE_PAGE_TITLE]?: string;
};

export type CustomSyncedBlockExtensionType = Node<Record<string, unknown>, unknown>;
