/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Node, mergeAttributes } from "@tiptap/core";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// types
import { ETableOfContentsAttributeNames } from "./types";
import type { CustomTableOfContentsExtensionType, TTableOfContentsAttributes } from "./types";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    [CORE_EXTENSIONS.CUSTOM_TABLE_OF_CONTENTS]: {
      insertTableOfContents: () => ReturnType;
    };
  }
}

export const DEFAULT_TOC_ATTRIBUTES: TTableOfContentsAttributes = {
  [ETableOfContentsAttributeNames.ID]: "",
};

export const CustomTableOfContentsExtensionConfig: CustomTableOfContentsExtensionType = Node.create({
  name: CORE_EXTENSIONS.CUSTOM_TABLE_OF_CONTENTS,
  group: "block",
  atom: true,

  addAttributes() {
    return {
      [ETableOfContentsAttributeNames.ID]: {
        default: DEFAULT_TOC_ATTRIBUTES[ETableOfContentsAttributeNames.ID],
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "toc-component",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["toc-component", mergeAttributes(HTMLAttributes)];
  },
});
