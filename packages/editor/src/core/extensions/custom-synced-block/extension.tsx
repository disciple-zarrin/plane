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
import { CustomSyncedBlockComponent } from "./components/block";
import { CustomSyncedBlockExtensionConfig } from "./extension-config";
import { ESyncedBlockAttributeNames } from "./types";

export function CustomSyncedBlockExtension() {
  return CustomSyncedBlockExtensionConfig.extend({
    addCommands() {
      return {
        insertSyncedBlock:
          (options?: { syncId?: string }) =>
          ({ commands }) => {
            const syncId = options?.syncId || uuidv4();

            return commands.insertContent({
              type: CORE_EXTENSIONS.CUSTOM_SYNCED_BLOCK,
              attrs: {
                [ESyncedBlockAttributeNames.SYNC_ID]: syncId,
              },
              content: [
                {
                  type: CORE_EXTENSIONS.PARAGRAPH,
                  content: [
                    {
                      type: "text",
                      text: "این یک بلوک همگام‌سازی‌شده است. محتوای این بلوک را ویرایش کنید...",
                    },
                  ],
                },
              ],
            });
          },
      };
    },

    addNodeView() {
      return ReactNodeViewRenderer(CustomSyncedBlockComponent);
    },
  });
}
