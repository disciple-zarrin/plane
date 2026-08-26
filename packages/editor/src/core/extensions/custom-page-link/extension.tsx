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
import { CustomPageLinkBlock } from "./components/block";
import type { CustomPageLinkNodeViewProps } from "./components/block";
import { CustomPageLinkExtensionConfig } from "./extension-config";
import { EPageLinkAttributeNames } from "./types";
import type {
  CustomPageLinkExtensionOptions,
  CustomPageLinkExtensionStorage,
} from "./types";

export function CustomPageLinkExtension() {
  return CustomPageLinkExtensionConfig.extend<
    CustomPageLinkExtensionOptions,
    CustomPageLinkExtensionStorage
  >({
    addCommands() {
      return {
        insertPageLink:
          (options?: { title?: string; url?: string }) =>
          ({ commands }) => {
            const pageLinkId = uuidv4();
            return commands.insertContent({
              type: CORE_EXTENSIONS.CUSTOM_PAGE_LINK,
              attrs: {
                [EPageLinkAttributeNames.ID]: pageLinkId,
                [EPageLinkAttributeNames.TITLE]: options?.title || "",
                [EPageLinkAttributeNames.URL]: options?.url || "",
              },
            });
          },
      };
    },

    addNodeView() {
      return ReactNodeViewRenderer((pageLinkProps) => (
        <CustomPageLinkBlock
          {...(pageLinkProps as unknown as CustomPageLinkNodeViewProps)}
        />
      ));
    },
  });
}
