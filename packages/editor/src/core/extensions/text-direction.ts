/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Extension } from "@tiptap/core";

export type TTextDirection = "ltr" | "rtl";

type TextDirectionOptions = {
  types: string[];
  directions: TTextDirection[];
  defaultDirection: TTextDirection | null;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    textDirection: {
      setTextDirection: (direction: TTextDirection) => ReturnType;
      unsetTextDirection: () => ReturnType;
    };
  }
}

/**
 * Per-block text direction (Word-style). Sets `dir` on the current
 * paragraph/heading so each line can be LTR or RTL independently.
 */
export const CustomTextDirectionExtension = Extension.create<TextDirectionOptions>({
  name: "textDirection",

  addOptions() {
    return {
      types: ["heading", "paragraph"],
      directions: ["ltr", "rtl"],
      defaultDirection: null,
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          dir: {
            default: this.options.defaultDirection,
            parseHTML: (element) => {
              const dir = element.getAttribute("dir");
              if (dir === "ltr" || dir === "rtl") return dir;
              return this.options.defaultDirection;
            },
            renderHTML: (attributes) => {
              if (!attributes.dir) return {};
              return { dir: attributes.dir };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setTextDirection:
        (direction) =>
        ({ commands }) => {
          if (!this.options.directions.includes(direction)) {
            return false;
          }
          return this.options.types
            .map((type) => commands.updateAttributes(type, { dir: direction }))
            .every((response) => response);
        },
      unsetTextDirection:
        () =>
        ({ commands }) =>
          this.options.types.map((type) => commands.resetAttributes(type, "dir")).every((response) => response),
    };
  },
});
