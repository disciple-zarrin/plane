/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Editor } from "@tiptap/core";
import type { LucideIcon } from "lucide-react";
import { AlignLeft, AlignRight } from "lucide-react";
// plane utils
import { cn } from "@plane/utils";
// components
import { TextDirectionItem } from "@/components/menus";
// types
import type { TEditorCommands } from "@/types";
import type { EditorStateType } from "./root";

type Props = {
  editor: Editor;
  editorState: EditorStateType;
};

export function TextDirectionSelector(props: Props) {
  const { editor, editorState } = props;
  const menuItem = TextDirectionItem(editor);

  const options: {
    itemKey: TEditorCommands;
    renderKey: string;
    icon: LucideIcon;
    label: string;
    command: () => void;
    isActive: () => boolean;
  }[] = [
    {
      itemKey: "text-direction",
      renderKey: "text-direction-ltr",
      icon: AlignLeft,
      label: "LTR",
      command: () =>
        menuItem.command({
          direction: "ltr",
        }),
      isActive: () => editorState.ltr,
    },
    {
      itemKey: "text-direction",
      renderKey: "text-direction-rtl",
      icon: AlignRight,
      label: "RTL",
      command: () =>
        menuItem.command({
          direction: "rtl",
        }),
      isActive: () => editorState.rtl,
    },
  ];

  if (editorState.code) return null;

  return (
    <div className="flex gap-0.5 px-2">
      {options.map((item) => (
        <button
          key={item.renderKey}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            item.command();
          }}
          className={cn(
            "inline-flex h-7 items-center gap-1 rounded-sm px-1.5 text-11 font-medium text-tertiary transition-colors hover:bg-layer-1 active:bg-layer-1",
            {
              "bg-layer-1 text-primary": item.isActive(),
            }
          )}
          aria-label={item.label}
        >
          <item.icon className="size-3.5" />
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}
