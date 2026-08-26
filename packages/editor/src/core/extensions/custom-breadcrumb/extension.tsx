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
import { CustomBreadcrumbBlock } from "./components/block";
import { CustomBreadcrumbExtensionConfig } from "./extension-config";
import { EBreadcrumbAttributeNames } from "./types";
import type {
  CustomBreadcrumbExtensionOptions,
  CustomBreadcrumbExtensionStorage,
} from "./types";

export function CustomBreadcrumbExtension() {
  return CustomBreadcrumbExtensionConfig.extend<
    CustomBreadcrumbExtensionOptions,
    CustomBreadcrumbExtensionStorage
  >({
    addCommands() {
      return {
        insertBreadcrumb:
          () =>
          ({ commands }) => {
            const breadcrumbId = uuidv4();
            return commands.insertContent({
              type: CORE_EXTENSIONS.CUSTOM_BREADCRUMB,
              attrs: {
                [EBreadcrumbAttributeNames.ID]: breadcrumbId,
              },
            });
          },
      };
    },

    addNodeView() {
      return ReactNodeViewRenderer(CustomBreadcrumbBlock);
    },
  });
}
