/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Node, mergeAttributes } from "@tiptap/core";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// types
import { EEmbedAttributeNames } from "./types";
import type { CustomEmbedExtensionType, TEmbedAttributes } from "./types";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    [CORE_EXTENSIONS.CUSTOM_EMBED]: {
      insertEmbed: (options?: {
        src?: string;
        originalUrl?: string;
        provider?: "youtube" | "aparat" | "figma" | "codepen" | "generic";
      }) => ReturnType;
    };
  }
}

export const DEFAULT_EMBED_ATTRIBUTES: TEmbedAttributes = {
  [EEmbedAttributeNames.ID]: "",
  [EEmbedAttributeNames.SRC]: "",
  [EEmbedAttributeNames.ORIGINAL_URL]: "",
  [EEmbedAttributeNames.PROVIDER]: "generic",
};

export const CustomEmbedExtensionConfig: CustomEmbedExtensionType = Node.create({
  name: CORE_EXTENSIONS.CUSTOM_EMBED,
  group: "block",
  atom: true,

  addAttributes() {
    return {
      [EEmbedAttributeNames.ID]: {
        default: DEFAULT_EMBED_ATTRIBUTES[EEmbedAttributeNames.ID],
      },
      [EEmbedAttributeNames.SRC]: {
        default: DEFAULT_EMBED_ATTRIBUTES[EEmbedAttributeNames.SRC],
      },
      [EEmbedAttributeNames.ORIGINAL_URL]: {
        default: DEFAULT_EMBED_ATTRIBUTES[EEmbedAttributeNames.ORIGINAL_URL],
      },
      [EEmbedAttributeNames.PROVIDER]: {
        default: DEFAULT_EMBED_ATTRIBUTES[EEmbedAttributeNames.PROVIDER],
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "embed-component",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["embed-component", mergeAttributes(HTMLAttributes)];
  },
});
