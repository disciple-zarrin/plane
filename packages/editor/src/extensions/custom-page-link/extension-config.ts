/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Node, mergeAttributes } from "@tiptap/core";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// types
import { EPageLinkAttributeNames } from "./types";
import type { CustomPageLinkExtensionType, TPageLinkAttributes } from "./types";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    [CORE_EXTENSIONS.CUSTOM_PAGE_LINK]: {
      insertPageLink: (options?: { title?: string; url?: string }) => ReturnType;
    };
  }
}

export const DEFAULT_PAGE_LINK_ATTRIBUTES: TPageLinkAttributes = {
  [EPageLinkAttributeNames.ID]: "",
  [EPageLinkAttributeNames.TITLE]: "Untitled Page",
  [EPageLinkAttributeNames.URL]: "",
};

export const CustomPageLinkExtensionConfig: CustomPageLinkExtensionType = Node.create({
  name: CORE_EXTENSIONS.CUSTOM_PAGE_LINK,
  group: "block",
  atom: true,

  addAttributes() {
    return {
      [EPageLinkAttributeNames.ID]: {
        default: DEFAULT_PAGE_LINK_ATTRIBUTES[EPageLinkAttributeNames.ID],
      },
      [EPageLinkAttributeNames.TITLE]: {
        default: DEFAULT_PAGE_LINK_ATTRIBUTES[EPageLinkAttributeNames.TITLE],
      },
      [EPageLinkAttributeNames.URL]: {
        default: DEFAULT_PAGE_LINK_ATTRIBUTES[EPageLinkAttributeNames.URL],
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "page-link-component",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["page-link-component", mergeAttributes(HTMLAttributes)];
  },
});
