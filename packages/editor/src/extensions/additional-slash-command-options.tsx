/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { FilePlus2 } from "lucide-react";
import type { TSlashCommandAdditionalOption } from "@/extensions";
import type { IEditorProps } from "@/types";

type Props = {
  disabledExtensions?: IEditorProps["disabledExtensions"];
  flaggedExtensions?: IEditorProps["flaggedExtensions"];
  extendedEditorProps?: IEditorProps["extendedEditorProps"];
};

type TExtendedSlashProps = {
  slashCommandAdditionalOptions?: TSlashCommandAdditionalOption[];
  onCreateSubpage?: () => void;
};

function triggerCreateSubpage(extendedEditorProps?: IEditorProps["extendedEditorProps"]) {
  const ext =
    extendedEditorProps && typeof extendedEditorProps === "object"
      ? (extendedEditorProps as TExtendedSlashProps)
      : undefined;

  if (typeof ext?.onCreateSubpage === "function") {
    try {
      ext.onCreateSubpage();
      return;
    } catch {
      /* fall through */
    }
  }

  if (typeof window === "undefined") return;

  const w = window as Window & {
    __planeCreateSubpage?: () => void;
    __planeRequestCreateSubpage?: () => boolean;
  };
  if (typeof w.__planeCreateSubpage === "function") {
    w.__planeCreateSubpage();
    return;
  }
  if (typeof w.__planeRequestCreateSubpage === "function" && w.__planeRequestCreateSubpage()) {
    return;
  }

  window.dispatchEvent(new CustomEvent("plane-create-subpage"));
  window.dispatchEvent(new CustomEvent("plane-wiki-create-subpage"));
}

export const coreEditorAdditionalSlashCommandOptions = (props: Props): TSlashCommandAdditionalOption[] => {
  const fromProps =
    props.extendedEditorProps &&
    typeof props.extendedEditorProps === "object" &&
    "slashCommandAdditionalOptions" in props.extendedEditorProps
      ? (props.extendedEditorProps as TExtendedSlashProps).slashCommandAdditionalOptions || []
      : [];

  const builtIn: TSlashCommandAdditionalOption[] = [
    {
      commandKey: "text" as TSlashCommandAdditionalOption["commandKey"],
      key: "subpage",
      title: "صفحه فرعی (Subpage)",
      description: "ساخت صفحه تو‌در‌تو مثل Notion",
      searchTerms: ["page", "subpage", "wiki", "صفحه", "فرعی", "nested"],
      icon: <FilePlus2 className="size-3.5" />,
      section: "general",
      pushAfter: "text",
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();
        setTimeout(() => triggerCreateSubpage(props.extendedEditorProps), 0);
      },
    },
  ];

  return [...builtIn, ...fromProps];
};
