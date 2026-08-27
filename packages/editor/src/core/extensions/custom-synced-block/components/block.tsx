/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState } from "react";
import type { NodeViewProps } from "@tiptap/react";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import { Check, Copy, Repeat, Unlink } from "lucide-react";
// types
import { ESyncedBlockAttributeNames } from "../types";

export const CustomSyncedBlockComponent: React.FC<NodeViewProps> = (props) => {
  const { node, deleteNode } = props;
  const syncId = node.attrs[ESyncedBlockAttributeNames.SYNC_ID] as string;
  const [copied, setCopied] = useState(false);

  const handleCopySyncId = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(`plane://synced-block/${syncId}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <NodeViewWrapper
      className="group/synced-block border-red-500/40 bg-red-500/[0.02] hover:border-red-500/60 dark:border-red-500/30 dark:hover:border-red-500/50 relative my-3 rounded-lg border-2 p-3 transition-colors"
      data-sync-id={syncId}
    >
      {/* Top Controls Bar */}
      <div
        contentEditable={false}
        className="border-red-500/20 text-xs text-red-600 dark:text-red-400 mb-2 flex items-center justify-between border-b pb-1.5 select-none"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1.5 font-medium">
          <Repeat className="size-3.5 animate-pulse" />
          <span>بلوک همگام‌سازی‌شده (Synced Block)</span>
        </div>

        <div className="flex items-center gap-1 opacity-80 transition-opacity group-hover/synced-block:opacity-100">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={handleCopySyncId}
            className="hover:bg-red-500/10 flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium transition-colors"
            title="کپی شناسه همگام‌سازی"
          >
            {copied ? <Check className="text-emerald-500 size-3" /> : <Copy className="size-3" />}
            <span>{copied ? "کپی شد" : "کپی شناسه"}</span>
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              deleteNode();
            }}
            className="hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors"
            title="حذف این بلوک"
          >
            <Unlink className="size-3" />
            <span>حذف</span>
          </button>
        </div>
      </div>

      {/* Editable Content */}
      <NodeViewContent className="synced-block-content min-h-[1.5rem]" />
    </NodeViewWrapper>
  );
};
