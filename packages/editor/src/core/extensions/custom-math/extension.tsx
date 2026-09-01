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
import { CustomMathBlock } from "./components/block";
import type { CustomMathNodeViewProps } from "./components/block";
import { CustomMathExtensionConfig } from "./extension-config";
import { EMathAttributeNames } from "./types";
import type { CustomMathExtensionOptions, CustomMathExtensionStorage } from "./types";

export function CustomMathExtension() {
  return CustomMathExtensionConfig.extend<CustomMathExtensionOptions, CustomMathExtensionStorage>({
    addCommands() {
      return {
        insertMath:
          (options?: { latex?: string }) =>
          ({ commands }) => {
            const mathId = uuidv4();
            return commands.insertContent({
              type: CORE_EXTENSIONS.CUSTOM_MATH,
              attrs: {
                [EMathAttributeNames.ID]: mathId,
                [EMathAttributeNames.LATEX]: options?.latex || "E = mc^2",
              },
            });
          },
      };
    },

    addNodeView() {
      return ReactNodeViewRenderer((mathProps) => (
        <CustomMathBlock {...(mathProps as unknown as CustomMathNodeViewProps)} />
      ));
    },
  });
}
