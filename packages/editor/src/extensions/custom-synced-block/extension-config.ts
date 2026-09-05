/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Node, mergeAttributes } from "@tiptap/core";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// types
import { ESyncedBlockAttributeNames } from "./types";
import type { CustomSyncedBlockExtensionType, TSyncedBlockAttributes } from "./types";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    [CORE_EXTENSIONS.CUSTOM_SYNCED_BLOCK]: {
      insertSyncedBlock: (options?: { syncId?: string }) => ReturnType;
    };
  }
}

export const DEFAULT_SYNCED_BLOCK_ATTRIBUTES: TSyncedBlockAttributes = {
  [ESyncedBlockAttributeNames.SYNC_ID]: "",
  [ESyncedBlockAttributeNames.SOURCE_PAGE_ID]: "",
  [ESyncedBlockAttributeNames.SOURCE_PAGE_TITLE]: "",
};

export const CustomSyncedBlockExtensionConfig: CustomSyncedBlockExtensionType = Node.create({
  name: CORE_EXTENSIONS.CUSTOM_SYNCED_BLOCK,
  group: "block",
  content: "block+",

  addAttributes() {
    return {
      [ESyncedBlockAttributeNames.SYNC_ID]: {
        default: DEFAULT_SYNCED_BLOCK_ATTRIBUTES[ESyncedBlockAttributeNames.SYNC_ID],
      },
      [ESyncedBlockAttributeNames.SOURCE_PAGE_ID]: {
        default: DEFAULT_SYNCED_BLOCK_ATTRIBUTES[ESyncedBlockAttributeNames.SOURCE_PAGE_ID],
      },
      [ESyncedBlockAttributeNames.SOURCE_PAGE_TITLE]: {
        default: DEFAULT_SYNCED_BLOCK_ATTRIBUTES[ESyncedBlockAttributeNames.SOURCE_PAGE_TITLE],
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: `div[${ESyncedBlockAttributeNames.SYNC_ID}]`,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes), 0];
  },
});
