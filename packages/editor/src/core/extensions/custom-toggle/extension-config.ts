/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Node, mergeAttributes } from "@tiptap/core";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// types
import { EToggleAttributeNames } from "./types";
import type { CustomToggleExtensionType, TToggleBlockAttributes } from "./types";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    [CORE_EXTENSIONS.CUSTOM_TOGGLE]: {
      insertToggle: (options?: { headingLevel?: 1 | 2 | 3 }) => ReturnType;
    };
  }
}

export const DEFAULT_TOGGLE_BLOCK_ATTRIBUTES: TToggleBlockAttributes = {
  [EToggleAttributeNames.ID]: "",
  [EToggleAttributeNames.IS_OPEN]: true,
};

export const CustomToggleExtensionConfig: CustomToggleExtensionType = Node.create({
  name: CORE_EXTENSIONS.CUSTOM_TOGGLE,
  group: "block",
  content: "block+",

  addAttributes() {
    return {
      [EToggleAttributeNames.ID]: {
        default: DEFAULT_TOGGLE_BLOCK_ATTRIBUTES[EToggleAttributeNames.ID],
      },
      [EToggleAttributeNames.IS_OPEN]: {
        default: DEFAULT_TOGGLE_BLOCK_ATTRIBUTES[EToggleAttributeNames.IS_OPEN],
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: `div[${EToggleAttributeNames.ID}]`,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes), 0];
  },
});
