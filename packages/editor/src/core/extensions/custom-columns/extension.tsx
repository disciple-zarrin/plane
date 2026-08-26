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
import { CustomColumnsBlock, CustomColumnBlock } from "./components/block";
import type { CustomColumnsNodeViewProps } from "./components/block";
import {
  CustomColumnsExtensionConfig,
  CustomColumnExtensionConfig,
} from "./extension-config";
import { EColumnsAttributeNames } from "./types";
import type {
  CustomColumnsExtensionOptions,
  CustomColumnsExtensionStorage,
} from "./types";

export function CustomColumnsExtension() {
  return CustomColumnsExtensionConfig.extend<
    CustomColumnsExtensionOptions,
    CustomColumnsExtensionStorage
  >({
    addCommands() {
      return {
        insertColumns:
          (options?: { count?: number }) =>
          ({ commands }) => {
            const count = options?.count ?? 2;
            const columnsId = uuidv4();
            const childColumns = Array.from({ length: count }, () => ({
              type: "customColumn",
              content: [
                {
                  type: CORE_EXTENSIONS.PARAGRAPH,
                },
              ],
            }));

            return commands.insertContent({
              type: CORE_EXTENSIONS.CUSTOM_COLUMNS,
              attrs: {
                [EColumnsAttributeNames.ID]: columnsId,
                [EColumnsAttributeNames.COUNT]: count,
              },
              content: childColumns,
            });
          },
      };
    },

    addNodeView() {
      return ReactNodeViewRenderer((colsProps) => (
        <CustomColumnsBlock {...(colsProps as unknown as CustomColumnsNodeViewProps)} />
      ));
    },
  });
}

export function CustomColumnExtension() {
  return CustomColumnExtensionConfig.extend({
    addNodeView() {
      return ReactNodeViewRenderer(CustomColumnBlock);
    },
  });
}
