/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import { ListTree, Hash } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
// plane imports
import { cn } from "@plane/utils";
// types
import type { TOCHeadingItem } from "../types";

export type CustomTableOfContentsNodeViewProps = NodeViewProps;

export function CustomTableOfContentsBlock(props: CustomTableOfContentsNodeViewProps) {
  const { editor, selected } = props;
  const [headings, setHeadings] = useState<TOCHeadingItem[]>([]);

  const extractHeadings = useCallback(() => {
    if (!editor || !editor.state || !editor.state.doc) return;
    const items: TOCHeadingItem[] = [];

    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "heading") {
        const text = node.textContent.trim();
        if (text) {
          items.push({
            id: `toc-${pos}`,
            text,
            level: node.attrs.level ?? 1,
            pos,
          });
        }
      }
    });

    setHeadings(items);
  }, [editor]);

  useEffect(() => {
    extractHeadings();

    const handleUpdate = () => {
      extractHeadings();
    };

    editor.on("update", handleUpdate);
    return () => {
      editor.off("update", handleUpdate);
    };
  }, [editor, extractHeadings]);

  const handleHeadingClick = useCallback(
    (pos: number) => {
      if (!editor) return;
      try {
        editor.commands.setTextSelection(pos + 1);
        const domNode = editor.view.nodeDOM(pos);
        if (domNode instanceof HTMLElement) {
          domNode.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      } catch (err) {
        console.error("Failed to scroll to heading:", err);
      }
    },
    [editor]
  );

  return (
    <NodeViewWrapper className="editor-toc-component my-3">
      <div
        contentEditable={false}
        className={cn(
          "flex w-full max-w-xl flex-col rounded-xl border border-subtle bg-layer-2 p-4 transition-all select-none",
          {
            "ring-2 ring-accent-primary border-transparent": selected && editor.isEditable,
            "hover:border-strong": !selected,
          }
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-subtle pb-2.5 text-xs font-bold text-secondary uppercase tracking-wider">
          <ListTree className="h-4 w-4 text-accent-primary" />
          <span>فهرست مطالب (Table of Contents)</span>
        </div>

        {/* Headings List */}
        {headings.length === 0 ? (
          <div className="py-4 text-center text-xs text-tertiary">
            برای نمایش فهرست، سرفصل‌های (H1، H2، H3) را به صفحه اضافه کنید.
          </div>
        ) : (
          <div className="flex flex-col gap-1 pt-3">
            {headings.map((item) => {
              const indentClass =
                item.level === 1
                  ? "pl-0 font-medium text-primary text-sm"
                  : item.level === 2
                  ? "pl-4 text-xs font-normal text-secondary"
                  : "pl-8 text-xs font-normal text-tertiary";

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleHeadingClick(item.pos)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2 py-1 text-left transition-colors hover:bg-layer-3 hover:text-primary",
                    indentClass
                  )}
                >
                  <Hash className="h-3 w-3 opacity-40 shrink-0" />
                  <span className="truncate">{item.text}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}
