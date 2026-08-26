/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState, useCallback } from "react";
import { Download, FileAudio, Copy, Check } from "lucide-react";
// plane imports
import { cn } from "@plane/utils";
// local imports
import { formatBytes, getAttachmentBlockId, isAttachmentDuplicating } from "../../utils";
import type { CustomAttachmentNodeViewProps } from "../node-view";

interface AudioPlayerBlockProps extends CustomAttachmentNodeViewProps {
  downloadSrc: string | undefined;
}

export function AudioPlayerBlock(props: AudioPlayerBlockProps) {
  const { editor, getPos, node, selected, downloadSrc } = props;
  const { id, originalName, size, status } = node.attrs;
  const isDuplicating = isAttachmentDuplicating(status);
  const [copied, setCopied] = useState(false);

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

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (downloadSrc) {
        navigator.clipboard.writeText(downloadSrc);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    },
    [downloadSrc]
  );

  const handleDownload = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
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
        "group my-2 flex w-full max-w-xl flex-col gap-2 rounded-xl border border-subtle bg-layer-2 p-3 transition-all",
        {
          "ring-2 ring-accent-primary border-transparent": selected && editor.isEditable,
          "hover:border-strong": editor.isEditable && !selected,
          "opacity-50 pointer-events-none": isDuplicating,
        }
      )}
      onClick={handleBlockClick}
    >
      {/* Meta Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400">
            <FileAudio className="h-4 w-4" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-xs font-semibold text-primary">
              {originalName || "فایل صوتی"}
            </span>
            <span className="text-[11px] text-tertiary">
              {size ? formatBytes(size) : "Audio file"}
            </span>
          </div>
        </div>

        {downloadSrc && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="grid h-7 w-7 shrink-0 place-items-center rounded text-tertiary transition-colors hover:bg-layer-3 hover:text-primary"
              onClick={handleCopy}
              title="کپی لینک فایل صوتی"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              className="grid h-7 w-7 shrink-0 place-items-center rounded text-tertiary transition-colors hover:bg-layer-3 hover:text-primary"
              onClick={handleDownload}
              title="دانلود فایل صوتی"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Native Player */}
      {downloadSrc && (
        <audio
          src={downloadSrc}
          controls
          preload="metadata"
          className="w-full h-8 outline-none"
        />
      )}
    </div>
  );
}
