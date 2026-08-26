/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { ReactNodeViewRenderer } from "@tiptap/react";
import { v4 as uuidv4 } from "uuid";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// local components
import { CustomTableOfContentsBlock } from "./components/block";
import { CustomTableOfContentsExtensionConfig } from "./extension-config";
import { ETableOfContentsAttributeNames } from "./types";
import type {
  CustomTableOfContentsExtensionOptions,
  CustomTableOfContentsExtensionStorage,
} from "./types";

export function CustomTableOfContentsExtension() {
  return CustomTableOfContentsExtensionConfig.extend<
    CustomTableOfContentsExtensionOptions,
    CustomTableOfContentsExtensionStorage
  >({
    addCommands() {
      return {
        insertTableOfContents:
          () =>
          ({ commands }) => {
            const tocId = uuidv4();
            return commands.insertContent({
              type: CORE_EXTENSIONS.CUSTOM_TABLE_OF_CONTENTS,
              attrs: {
                [ETableOfContentsAttributeNames.ID]: tocId,
              },
            });
          },
      };
    },

    addNodeView() {
      return ReactNodeViewRenderer((tocProps) => (
        <CustomTableOfContentsBlock {...tocProps} />
      ));
    },
  });
}
