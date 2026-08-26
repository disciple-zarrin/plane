/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import { ChevronRight, Folder, FileText } from "lucide-react";
import React from "react";
// plane imports
import { cn } from "@plane/utils";

export function CustomBreadcrumbBlock(props: NodeViewProps) {
  const { selected, editor } = props;

  return (
    <NodeViewWrapper className="editor-breadcrumb-component my-2 select-none">
      <div
        contentEditable={false}
        className={cn(
          "flex items-center gap-1.5 rounded-lg border border-subtle bg-layer-2 px-3 py-1.5 text-xs text-tertiary transition-all",
          {
            "ring-2 ring-accent-primary border-transparent": selected && editor.isEditable,
            "hover:border-strong": !selected,
          }
        )}
      >
        <span className="flex items-center gap-1 font-medium text-secondary hover:text-primary transition-colors cursor-pointer">
          <Folder className="h-3.5 w-3.5 text-accent-primary" />
          <span>پروژه</span>
        </span>
        <ChevronRight className="h-3 w-3 opacity-40 rtl:rotate-180" />
        <span className="flex items-center gap-1 font-medium text-secondary hover:text-primary transition-colors cursor-pointer">
          <span>داکیومنت‌ها</span>
        </span>
        <ChevronRight className="h-3 w-3 opacity-40 rtl:rotate-180" />
        <span className="flex items-center gap-1 font-semibold text-primary">
          <FileText className="h-3.5 w-3.5 text-indigo-500" />
          <span>صفحه فعلی</span>
        </span>
      </div>
    </NodeViewWrapper>
  );
}
