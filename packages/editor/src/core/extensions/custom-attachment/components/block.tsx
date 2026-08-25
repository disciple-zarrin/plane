/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { NodeSelection } from "@tiptap/pm/state";
import React, { useCallback } from "react";
import { Download, FileIcon } from "lucide-react";
// plane imports
import { cn } from "@plane/utils";
// local imports
import { ECustomAttachmentAttributeNames } from "../types";
import { formatBytes, getAttachmentBlockId, isAttachmentDuplicating } from "../utils";
import type { CustomAttachmentNodeViewProps } from "./node-view";
import { ECustomAttachmentStatus } from "../types";

type CustomAttachmentBlockProps = CustomAttachmentNodeViewProps & {
  downloadSrc: string | undefined;
};

export function CustomAttachmentBlock(props: CustomAttachmentBlockProps) {
  const {
    editor,
    getPos,
    node,
    selected,
    downloadSrc,
  } = props;

  const { id, originalName, size, status } = node.attrs;
  const isDuplicating = isAttachmentDuplicating(status);

  const handleBlockClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (editor.isEditable && typeof getPos === "function") {
        const pos = getPos();
        if (pos !== undefined) {
          editor.commands.setNodeSelection(pos);
        }
      }
    },
    [editor, getPos]
  );

  const handleDownloadClick = useCallback(
    (e: React.MouseEvent) => {
      if (downloadSrc) {
        window.open(downloadSrc, "_blank");
      }
    },
    [downloadSrc]
  );

  return (
    <div
      id={getAttachmentBlockId(id ?? "")}
      data-drag-handle
      className={cn(
        "group relative flex w-full max-w-sm items-center justify-between rounded-lg border border-subtle bg-layer-2 px-3 py-2 transition-all",
        {
          "ring-2 ring-accent-primary": selected && editor.isEditable,
          "hover:border-strong": editor.isEditable && !selected,
          "opacity-50": isDuplicating,
        }
      )}
      onClick={handleBlockClick}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded bg-layer-3 text-secondary">
          <FileIcon className="h-5 w-5" />
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="truncate text-sm font-medium text-primary">
            {originalName || "Attachment"}
          </span>
          <span className="text-xs text-tertiary">
            {size ? formatBytes(size) : "Unknown size"}
          </span>
        </div>
      </div>
      
      <div className="shrink-0 flex items-center gap-2 pl-2">
        {downloadSrc && (
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded hover:bg-layer-3 text-secondary hover:text-primary transition-colors"
            onClick={handleDownloadClick}
            title="Download file"
          >
            <Download className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
