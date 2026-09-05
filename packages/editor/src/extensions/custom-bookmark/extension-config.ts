/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { mergeAttributes, Node } from "@tiptap/core";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// local imports
import { ECustomBookmarkAttributeNames } from "./types";
import type {
  CustomBookmarkExtensionOptions,
  TCustomBookmarkAttributes,
  CustomBookmarkExtensionType,
  CustomBookmarkExtensionStorage,
  InsertBookmarkComponentProps,
} from "./types";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    [CORE_EXTENSIONS.CUSTOM_BOOKMARK]: {
      insertBookmarkComponent: (props?: InsertBookmarkComponentProps) => ReturnType;
    };
  }
}

export const DEFAULT_CUSTOM_BOOKMARK_ATTRIBUTES: TCustomBookmarkAttributes = {
  [ECustomBookmarkAttributeNames.ID]: null,
  [ECustomBookmarkAttributeNames.URL]: null,
  [ECustomBookmarkAttributeNames.TITLE]: null,
  [ECustomBookmarkAttributeNames.DESCRIPTION]: null,
  [ECustomBookmarkAttributeNames.FAVICON]: null,
};

export const CustomBookmarkExtensionConfig: CustomBookmarkExtensionType = Node.create<
  CustomBookmarkExtensionOptions,
  CustomBookmarkExtensionStorage
>({
  name: CORE_EXTENSIONS.CUSTOM_BOOKMARK,
  group: "block",
  atom: true,

  addAttributes() {
    return Object.values(ECustomBookmarkAttributeNames).reduce(
      (acc, value) => {
        acc[value] = {
          default: DEFAULT_CUSTOM_BOOKMARK_ATTRIBUTES[value],
        };
        return acc;
      },
      {} as Record<ECustomBookmarkAttributeNames, { default: TCustomBookmarkAttributes[ECustomBookmarkAttributeNames] }>
    );
  },

  parseHTML() {
    return [
      {
        tag: "bookmark-component",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["bookmark-component", mergeAttributes(HTMLAttributes)];
  },
});
