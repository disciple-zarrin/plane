/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Node, mergeAttributes } from "@tiptap/core";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// types
import { EBreadcrumbAttributeNames } from "./types";
import type { CustomBreadcrumbExtensionType, TBreadcrumbAttributes } from "./types";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    [CORE_EXTENSIONS.CUSTOM_BREADCRUMB]: {
      insertBreadcrumb: () => ReturnType;
    };
  }
}

export const DEFAULT_BREADCRUMB_ATTRIBUTES: TBreadcrumbAttributes = {
  [EBreadcrumbAttributeNames.ID]: "",
};

export const CustomBreadcrumbExtensionConfig: CustomBreadcrumbExtensionType = Node.create({
  name: CORE_EXTENSIONS.CUSTOM_BREADCRUMB,
  group: "block",
  atom: true,

  addAttributes() {
    return {
      [EBreadcrumbAttributeNames.ID]: {
        default: DEFAULT_BREADCRUMB_ATTRIBUTES[EBreadcrumbAttributeNames.ID],
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "breadcrumb-component",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["breadcrumb-component", mergeAttributes(HTMLAttributes)];
  },
});
