/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Node, mergeAttributes } from "@tiptap/core";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// types
import { EMathAttributeNames } from "./types";
import type { CustomMathExtensionType, TMathBlockAttributes } from "./types";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    [CORE_EXTENSIONS.CUSTOM_MATH]: {
      insertMath: (options?: { latex?: string }) => ReturnType;
    };
  }
}

export const DEFAULT_MATH_ATTRIBUTES: TMathBlockAttributes = {
  [EMathAttributeNames.ID]: "",
  [EMathAttributeNames.LATEX]: "E = mc^2",
};

export const CustomMathExtensionConfig: CustomMathExtensionType = Node.create({
  name: CORE_EXTENSIONS.CUSTOM_MATH,
  group: "block",
  atom: true,

  addAttributes() {
    return {
      [EMathAttributeNames.ID]: {
        default: DEFAULT_MATH_ATTRIBUTES[EMathAttributeNames.ID],
      },
      [EMathAttributeNames.LATEX]: {
        default: DEFAULT_MATH_ATTRIBUTES[EMathAttributeNames.LATEX],
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: `math-component`,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["math-component", mergeAttributes(HTMLAttributes)];
  },
});
