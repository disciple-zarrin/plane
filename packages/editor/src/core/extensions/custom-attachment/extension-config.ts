/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { mergeAttributes, Node } from "@tiptap/core";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// local imports
import { ECustomAttachmentAttributeNames } from "./types";
import type {
  CustomAttachmentExtensionOptions,
  TCustomAttachmentAttributes,
  CustomAttachmentExtensionType,
  CustomAttachmentExtensionStorage,
  InsertAttachmentComponentProps,
} from "./types";
import { DEFAULT_CUSTOM_ATTACHMENT_ATTRIBUTES } from "./utils";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    [CORE_EXTENSIONS.CUSTOM_ATTACHMENT]: {
      insertAttachmentComponent: ({ file, pos, event }: InsertAttachmentComponentProps) => ReturnType;
    };
  }
  interface Storage {
    [CORE_EXTENSIONS.CUSTOM_ATTACHMENT]: CustomAttachmentExtensionStorage;
  }
}

export const CustomAttachmentExtensionConfig: CustomAttachmentExtensionType = Node.create<
  CustomAttachmentExtensionOptions,
  CustomAttachmentExtensionStorage
>({
  name: CORE_EXTENSIONS.CUSTOM_ATTACHMENT,
  group: "block",
  atom: true,

  addAttributes() {
    const attributes = {
      ...this.parent?.(),
      ...Object.values(ECustomAttachmentAttributeNames).reduce(
        (acc, value) => {
          acc[value] = {
            default: DEFAULT_CUSTOM_ATTACHMENT_ATTRIBUTES[value],
          };
          return acc;
        },
        {} as Record<ECustomAttachmentAttributeNames, { default: TCustomAttachmentAttributes[ECustomAttachmentAttributeNames] }>
      ),
    };

    return attributes;
  },

  parseHTML() {
    return [
      {
        tag: "attachment-component",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["attachment-component", mergeAttributes(HTMLAttributes)];
  },
});
