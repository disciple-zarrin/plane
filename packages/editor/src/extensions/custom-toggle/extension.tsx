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
import { CustomToggleBlock } from "./components/block";
import type { CustomToggleNodeViewProps } from "./components/block";
import { CustomToggleExtensionConfig } from "./extension-config";
import { EToggleAttributeNames } from "./types";
import type { CustomToggleExtensionOptions, CustomToggleExtensionStorage } from "./types";

export function CustomToggleExtension() {
  return CustomToggleExtensionConfig.extend<CustomToggleExtensionOptions, CustomToggleExtensionStorage>({
    addCommands() {
      return {
        insertToggle:
          (options?: { headingLevel?: 1 | 2 | 3 }) =>
          ({ commands }) => {
            const toggleId = uuidv4();
            const headingLevel = options?.headingLevel;

            return commands.insertContent({
              type: CORE_EXTENSIONS.CUSTOM_TOGGLE,
              attrs: {
                [EToggleAttributeNames.ID]: toggleId,
                [EToggleAttributeNames.IS_OPEN]: true,
              },
              content: [
                headingLevel
                  ? {
                      type: CORE_EXTENSIONS.HEADING,
                      attrs: { level: headingLevel },
                      content: [
                        {
                          type: "text",
                          text: `تیتر تاشو ${headingLevel === 1 ? "بزرگ" : headingLevel === 2 ? "متوسط" : "کوچک"}`,
                        },
                      ],
                    }
                  : {
                      type: CORE_EXTENSIONS.PARAGRAPH,
                    },
                {
                  type: CORE_EXTENSIONS.PARAGRAPH,
                },
              ],
            });
          },
      };
    },

    addNodeView() {
      return ReactNodeViewRenderer((toggleProps) => (
        <CustomToggleBlock {...(toggleProps as unknown as CustomToggleNodeViewProps)} />
      ));
    },
  });
}
