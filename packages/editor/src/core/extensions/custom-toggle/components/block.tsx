/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { NodeViewProps } from "@tiptap/react";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import { ChevronRight } from "lucide-react";
import React, { useCallback } from "react";
// plane imports
import { cn } from "@plane/utils";
// types
import type { TToggleBlockAttributes } from "../types";
import { EToggleAttributeNames } from "../types";

export type CustomToggleNodeViewProps = NodeViewProps & {
  node: NodeViewProps["node"] & {
    attrs: TToggleBlockAttributes;
  };
  updateAttributes: (attrs: Partial<TToggleBlockAttributes>) => void;
};

export function CustomToggleBlock(props: CustomToggleNodeViewProps) {
  const { node, updateAttributes, editor } = props;
  const isOpen = node.attrs[EToggleAttributeNames.IS_OPEN] ?? true;

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      updateAttributes({
        [EToggleAttributeNames.IS_OPEN]: !isOpen,
      });
    },
    [isOpen, updateAttributes]
  );

  return (
    <NodeViewWrapper
      key={node.attrs[EToggleAttributeNames.ID]}
      className="editor-toggle-component group/toggle my-1.5 flex flex-col rounded-lg transition-all"
    >
      <div className="flex items-start gap-1">
        {/* Toggle Chevron Button */}
        <button
          type="button"
          onClick={handleToggle}
          contentEditable={false}
          className={cn(
            "grid h-6 w-6 shrink-0 place-items-center rounded text-tertiary transition-all duration-150 hover:bg-layer-3 hover:text-primary mt-0.5",
            "cursor-pointer select-none"
          )}
          title={isOpen ? "بستن بخش (Collapse)" : "باز کردن بخش (Expand)"}
        >
          <ChevronRight
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              isOpen ? "rotate-90 text-primary" : "text-tertiary"
            )}
          />
        </button>

        {/* Content Container */}
        <div className="flex-1 min-w-0">
          <NodeViewContent
            as="div"
            className={cn(
              "w-full break-words transition-all duration-200",
              !isOpen && "hidden"
            )}
          />
        </div>
      </div>
    </NodeViewWrapper>
  );
}
