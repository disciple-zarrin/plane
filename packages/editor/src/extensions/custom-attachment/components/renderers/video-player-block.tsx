/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState, useCallback, useRef, useMemo } from "react";
import { Download, ExternalLink, FileVideo, Copy, Check } from "lucide-react";
// plane imports
import { cn } from "@plane/utils";
// local imports
import { formatBytes, getAttachmentBlockId, isAttachmentDuplicating } from "../../utils";
import type { CustomAttachmentNodeViewProps } from "../node-view";
import { transformToEmbedUrl } from "../../../custom-embed/components/block";

interface VideoPlayerBlockProps extends CustomAttachmentNodeViewProps {
  downloadSrc: string | undefined;
}

export function VideoPlayerBlock(props: VideoPlayerBlockProps) {
  const { editor, getPos, node, selected, downloadSrc } = props;
  const { id, originalName, size, status, src } = node.attrs;
  const videoRef = useRef<HTMLVideoElement>(null);
  const isDuplicating = isAttachmentDuplicating(status);
  const [copied, setCopied] = useState(false);

  const effectiveSrc = useMemo(() => {
    if (downloadSrc) return downloadSrc;
    if (src && (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("blob:"))) {
      return src;
    }
    return undefined;
  }, [downloadSrc, src]);

  // Check if it's a third-party embed (e.g. YouTube, Aparat, Loom, Vimeo)
  const embedInfo = useMemo(() => {
    if (!effectiveSrc) return null;
    if (
      effectiveSrc.includes("youtube.com") ||
      effectiveSrc.includes("youtu.be") ||
      effectiveSrc.includes("aparat.com") ||
      effectiveSrc.includes("loom.com") ||
      effectiveSrc.includes("vimeo.com")
    ) {
      return transformToEmbedUrl(effectiveSrc);
    }
    return null;
  }, [effectiveSrc]);

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
      if (effectiveSrc) {
        navigator.clipboard.writeText(effectiveSrc);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    },
    [effectiveSrc]
  );

  const handleDownload = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (effectiveSrc) {
        window.open(effectiveSrc, "_blank");
      }
    },
    [effectiveSrc]
  );

  return (
    <div
      id={getAttachmentBlockId(id ?? "")}
      contentEditable={false}
      className={cn(
        "group my-2 flex w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-subtle bg-layer-1 transition-all",
        {
          "ring-accent-primary border-transparent ring-2": selected && editor.isEditable,
          "hover:border-strong": editor.isEditable && !selected,
          "pointer-events-none opacity-50": isDuplicating,
        }
      )}
      onClick={handleBlockClick}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-subtle bg-layer-2 px-3 py-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 grid h-6 w-6 shrink-0 place-items-center rounded">
            <FileVideo className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs truncate font-medium text-primary">{originalName || "Video Player"}</span>
          {size ? <span className="shrink-0 text-[11px] text-tertiary">({formatBytes(size)})</span> : null}
        </div>

        <div className="flex items-center gap-1">
          {effectiveSrc && (
            <>
              <button
                type="button"
                className="grid h-7 w-7 place-items-center rounded text-tertiary transition-colors hover:bg-layer-3 hover:text-primary"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={handleCopy}
                title="کپی لینک ویدیو"
              >
                {copied ? <Check className="text-emerald-500 h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                className="grid h-7 w-7 place-items-center rounded text-tertiary transition-colors hover:bg-layer-3 hover:text-primary"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={handleDownload}
                title="دانلود / باز کردن ویدیو"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="grid h-7 w-7 place-items-center rounded text-tertiary transition-colors hover:bg-layer-3 hover:text-primary"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
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
      <div className="relative aspect-video w-full bg-black/95">
        {embedInfo ? (
          <iframe
            src={embedInfo.embedUrl}
            title={originalName || "Embedded Video"}
            className="size-full border-0"
            sandbox="allow-scripts allow-presentation allow-popups allow-forms"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : effectiveSrc ? (
          <video
            ref={videoRef}
            src={effectiveSrc}
            controls
            preload="metadata"
            playsInline
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="text-xs grid h-full w-full place-items-center text-tertiary">
            در حال آماده‌سازی پخش‌کننده ویدیو...
          </div>
        )}
      </div>
    </div>
  );
}
