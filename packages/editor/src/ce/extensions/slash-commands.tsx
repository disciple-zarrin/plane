/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { FilePlus2 } from "lucide-react";
import type { TSlashCommandAdditionalOption } from "@/extensions";
import type { IEditorProps } from "@/types";

type Props = Pick<IEditorProps, "disabledExtensions" | "flaggedExtensions" | "extendedEditorProps">;

export const coreEditorAdditionalSlashCommandOptions = (props: Props): TSlashCommandAdditionalOption[] => {
  const fromProps =
    props.extendedEditorProps &&
    typeof props.extendedEditorProps === "object" &&
    "slashCommandAdditionalOptions" in props.extendedEditorProps
      ? (props.extendedEditorProps as { slashCommandAdditionalOptions?: TSlashCommandAdditionalOption[] })
          .slashCommandAdditionalOptions || []
      : [];

  const builtIn: TSlashCommandAdditionalOption[] = [
    {
      commandKey: "text" as TSlashCommandAdditionalOption["commandKey"],
      key: "subpage",
      title: "صفحه فرعی",
      description: "ساخت صفحه تو‌در‌تو مثل Notion",
      searchTerms: ["page", "subpage", "wiki", "صفحه", "فرعی"],
      icon: <FilePlus2 className="size-3.5" />,
      section: "general",
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("plane-wiki-create-subpage"));
        }
      },
    },
  ];

  return [...builtIn, ...fromProps];
};
