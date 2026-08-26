/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState, useCallback, useRef } from "react";
import { Download, ExternalLink, FileVideo, Copy, Check } from "lucide-react";
// plane imports
import { cn } from "@plane/utils";
// local imports
import { formatBytes, getAttachmentBlockId, isAttachmentDuplicating } from "../../utils";
import type { CustomAttachmentNodeViewProps } from "../node-view";

interface VideoPlayerBlockProps extends CustomAttachmentNodeViewProps {
  downloadSrc: string | undefined;
}

export function VideoPlayerBlock(props: VideoPlayerBlockProps) {
  const { editor, getPos, node, selected, downloadSrc } = props;
  const { id, originalName, size, status } = node.attrs;
  const videoRef = useRef<HTMLVideoElement>(null);
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
        "group my-2 flex w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-subtle bg-layer-1 transition-all",
        {
          "ring-2 ring-accent-primary border-transparent": selected && editor.isEditable,
          "hover:border-strong": editor.isEditable && !selected,
          "opacity-50 pointer-events-none": isDuplicating,
        }
      )}
      onClick={handleBlockClick}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-subtle bg-layer-2 px-3 py-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="grid h-6 w-6 shrink-0 place-items-center rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <FileVideo className="h-3.5 w-3.5" />
          </div>
          <span className="truncate text-xs font-medium text-primary">
            {originalName || "Video"}
          </span>
          {size ? (
            <span className="shrink-0 text-[11px] text-tertiary">
              ({formatBytes(size)})
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-1">
          {downloadSrc && (
            <>
              <button
                type="button"
                className="grid h-7 w-7 place-items-center rounded text-tertiary transition-colors hover:bg-layer-3 hover:text-primary"
                onClick={handleCopy}
                title="کپی لینک ویدیو"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                className="grid h-7 w-7 place-items-center rounded text-tertiary transition-colors hover:bg-layer-3 hover:text-primary"
                onClick={handleDownload}
                title="دانلود ویدیو"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="grid h-7 w-7 place-items-center rounded text-tertiary transition-colors hover:bg-layer-3 hover:text-primary"
                onClick={handleDownload}
                title="باز کردن در تب جدید"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Video Container */}
      <div className="relative aspect-video w-full bg-black/90 dark:bg-black">
        {downloadSrc ? (
          <video
            ref={videoRef}
            src={downloadSrc}
            controls
            preload="metadata"
            playsInline
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-tertiary text-xs">
            در حال آماده‌سازی پلیر...
          </div>
        )}
      </div>
    </div>
  );
}
