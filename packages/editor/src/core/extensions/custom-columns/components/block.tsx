/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { NodeViewProps } from "@tiptap/react";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import React from "react";
// plane imports
import { cn } from "@plane/utils";
// types
import type { TColumnsAttributes } from "../types";
import { EColumnsAttributeNames } from "../types";

export type CustomColumnsNodeViewProps = NodeViewProps & {
  node: NodeViewProps["node"] & {
    attrs: TColumnsAttributes;
  };
};

export function CustomColumnsBlock(props: CustomColumnsNodeViewProps) {
  const { node } = props;
  const count = node.attrs[EColumnsAttributeNames.COUNT] || 2;

  return (
    <NodeViewWrapper className="editor-columns-container my-3">
      <NodeViewContent
        as="div"
        className={cn("grid w-full gap-3", count === 3 ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2")}
      />
    </NodeViewWrapper>
  );
}

export function CustomColumnBlock(props: NodeViewProps) {
  const { selected, editor } = props;

  return (
    <NodeViewWrapper className="editor-column-item min-w-0 flex-1">
      <div
        className={cn("min-h-[60px] rounded-xl border border-dashed border-subtle/60 p-3 transition-colors", {
          "ring-accent-primary border-transparent ring-2": selected && editor.isEditable,
          "hover:border-subtle": !selected,
        })}
      >
        <NodeViewContent as="div" className="w-full min-w-0 break-words" />
      </div>
    </NodeViewWrapper>
  );
}
