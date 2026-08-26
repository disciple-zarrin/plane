/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { ReactNodeViewRenderer } from "@tiptap/react";
import { v4 as uuidv4 } from "uuid";
// helpers
import { insertEmptyParagraphAtNodeBoundaries } from "@/helpers/insert-empty-paragraph-at-node-boundary";
// local imports
import { CustomBookmarkBlock } from "./components/block";
import type { CustomBookmarkNodeViewProps } from "./components/block";
import { CustomBookmarkExtensionConfig } from "./extension-config";
import { ECustomBookmarkAttributeNames } from "./types";
import type { CustomBookmarkExtensionOptions, CustomBookmarkExtensionStorage } from "./types";

type Props = {
  isEditable: boolean;
};

export function CustomBookmarkExtension(props: Props) {
  const { isEditable } = props;

  return CustomBookmarkExtensionConfig.extend<CustomBookmarkExtensionOptions, CustomBookmarkExtensionStorage>({
    selectable: isEditable,
    draggable: isEditable,

    addCommands() {
      return {
        insertBookmarkComponent:
          (bookmarkProps) =>
          ({ commands }) => {
            const fileId = uuidv4();
            const attributes = {
              [ECustomBookmarkAttributeNames.ID]: fileId,
              [ECustomBookmarkAttributeNames.URL]: bookmarkProps?.url ?? null,
              [ECustomBookmarkAttributeNames.TITLE]: bookmarkProps?.title ?? null,
              [ECustomBookmarkAttributeNames.DESCRIPTION]: bookmarkProps?.description ?? null,
            };

            if (bookmarkProps?.pos) {
              return commands.insertContentAt(bookmarkProps.pos, {
                type: this.name,
                attrs: attributes,
              });
            }
            return commands.insertContent({
              type: this.name,
              attrs: attributes,
            });
          },
      };
    },

    addKeyboardShortcuts() {
      return {
        ArrowDown: insertEmptyParagraphAtNodeBoundaries("down", this.name),
        ArrowUp: insertEmptyParagraphAtNodeBoundaries("up", this.name),
      };
    },

    addNodeView() {
      return ReactNodeViewRenderer((nodeProps) => (
        <CustomBookmarkBlock {...(nodeProps as unknown as CustomBookmarkNodeViewProps)} />
      ));
    },
  });
}
