/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { ReactNodeViewRenderer } from "@tiptap/react";
import { v4 as uuidv4 } from "uuid";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
import type { TMentionHandler } from "@/types";
// local components
import { CustomPageLinkBlock } from "./components/block";
import type { CustomPageLinkNodeViewProps } from "./components/block";
import { CustomPageLinkExtensionConfig } from "./extension-config";
import { EPageLinkAttributeNames } from "./types";
import type { CustomPageLinkExtensionOptions, CustomPageLinkExtensionStorage } from "./types";

type Props = {
  mentionHandler?: TMentionHandler;
};

export function CustomPageLinkExtension(props?: Props) {
  const { mentionHandler } = props ?? {};

  return CustomPageLinkExtensionConfig.extend<CustomPageLinkExtensionOptions, CustomPageLinkExtensionStorage>({
    addOptions() {
      return {
        ...this.parent?.(),
        mentionHandler,
      };
    },

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
        <CustomPageLinkBlock {...(pageLinkProps as unknown as CustomPageLinkNodeViewProps)} />
      ));
    },
  });
}
