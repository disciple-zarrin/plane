/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Node, mergeAttributes } from "@tiptap/core";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// types
import { EColumnsAttributeNames } from "./types";
import type { CustomColumnsExtensionType, TColumnsAttributes } from "./types";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    [CORE_EXTENSIONS.CUSTOM_COLUMNS]: {
      insertColumns: (options?: { count?: number }) => ReturnType;
    };
  }
}

export const DEFAULT_COLUMNS_ATTRIBUTES: TColumnsAttributes = {
  [EColumnsAttributeNames.ID]: "",
  [EColumnsAttributeNames.COUNT]: 2,
};

export const CustomColumnsExtensionConfig: CustomColumnsExtensionType = Node.create({
  name: CORE_EXTENSIONS.CUSTOM_COLUMNS,
  group: "block",
  content: "customColumn+",

  addAttributes() {
    return {
      [EColumnsAttributeNames.ID]: {
        default: DEFAULT_COLUMNS_ATTRIBUTES[EColumnsAttributeNames.ID],
      },
      [EColumnsAttributeNames.COUNT]: {
        default: DEFAULT_COLUMNS_ATTRIBUTES[EColumnsAttributeNames.COUNT],
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "columns-container",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["columns-container", mergeAttributes(HTMLAttributes), 0];
  },
});

export const CustomColumnExtensionConfig = Node.create({
  name: "customColumn",
  content: "block+",
  isolating: true,

  parseHTML() {
    return [
      {
        tag: "column-item",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["column-item", mergeAttributes(HTMLAttributes), 0];
  },
});
