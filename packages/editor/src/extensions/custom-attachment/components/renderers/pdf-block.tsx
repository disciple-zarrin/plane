/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState, useCallback, useMemo } from "react";
import { Download, ExternalLink, FileText, LayoutList, Maximize2, Copy, Check } from "lucide-react";
// plane imports
import { cn } from "@plane/utils";
// local imports
import { formatBytes, getAttachmentBlockId, isAttachmentDuplicating } from "../../utils";
import type { CustomAttachmentNodeViewProps } from "../node-view";

interface PDFBlockProps extends CustomAttachmentNodeViewProps {
  downloadSrc: string | undefined;
}

export function PDFBlock(props: PDFBlockProps) {
  const { editor, getPos, node, selected, downloadSrc } = props;
  const { id, originalName, size, status, src } = node.attrs;
  const isDuplicating = isAttachmentDuplicating(status);

  const [isEmbedView, setIsEmbedView] = useState(false);
  const [copied, setCopied] = useState(false);

  const effectiveSrc = useMemo(() => {
    if (downloadSrc) return downloadSrc;
    if (src && (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("blob:"))) {
      return src;
    }
    return undefined;
  }, [downloadSrc, src]);

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

  const handleOpenPreview = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (effectiveSrc) {
        window.open(effectiveSrc, "_blank");
      }
    },
    [effectiveSrc]
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
        const a = document.createElement("a");
        a.href = effectiveSrc;
        a.download = originalName || "document.pdf";
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    },
    [effectiveSrc, originalName]
  );

  return (
    <div
      id={getAttachmentBlockId(id ?? "")}
      contentEditable={false}
      className={cn(
        "group my-2 flex w-full cursor-pointer flex-col overflow-hidden rounded-xl border border-subtle bg-layer-2 transition-all select-none",
        isEmbedView ? "max-w-3xl" : "max-w-lg",
        {
          "ring-accent-primary border-transparent ring-2": selected && editor.isEditable,
          "hover:border-strong hover:bg-layer-2-hover": !selected,
          "pointer-events-none opacity-50": isDuplicating,
        }
      )}
      onClick={handleBlockClick}
      onDoubleClick={handleOpenPreview}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Red PDF Icon Badge */}
          <div className="bg-red-500/10 text-red-600 dark:bg-red-400/10 dark:text-red-400 grid h-10 w-10 shrink-0 place-items-center rounded-lg">
            <FileText className="h-5 w-5" />
          </div>

          {/* Info */}
          <div className="flex flex-col overflow-hidden">
            <div className="flex items-center gap-2">
              <span className="text-sm truncate font-semibold text-primary">{originalName || "Document.pdf"}</span>
              <span className="bg-red-500/10 text-red-600 dark:text-red-400 rounded px-1.5 py-0.5 text-[10px] font-bold">
                PDF
              </span>
            </div>
            <span className="text-xs text-tertiary">{size ? formatBytes(size) : "PDF Document"}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 pl-2">
          {effectiveSrc && (
            <>
              {/* Embed view toggle */}
              <button
                type="button"
                className="text-xs flex items-center gap-1 rounded-md px-2 py-1 font-medium text-tertiary transition-colors hover:bg-layer-3 hover:text-primary"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEmbedView((prev) => !prev);
                }}
                title={isEmbedView ? "نمایش کارتی" : "نمایش در صفحه"}
              >
                {isEmbedView ? <LayoutList className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{isEmbedView ? "کارت" : "نمایش"}</span>
              </button>

              <button
                type="button"
                className="grid h-8 w-8 place-items-center rounded-md text-tertiary transition-colors hover:bg-layer-3 hover:text-primary"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={handleCopy}
                title="کپی لینک فایل"
              >
                {copied ? <Check className="text-emerald-500 h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>

              <button
                type="button"
                className="grid h-8 w-8 place-items-center rounded-md text-tertiary transition-colors hover:bg-layer-3 hover:text-primary"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={handleOpenPreview}
                title="باز کردن در تب جدید"
              >
                <ExternalLink className="h-4 w-4" />
              </button>

              <button
                type="button"
                className="grid h-8 w-8 place-items-center rounded-md text-tertiary transition-colors hover:bg-layer-3 hover:text-primary"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={handleDownload}
                title="دانلود فایل"
              >
                <Download className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Inline Embedded PDF Viewer */}
      {isEmbedView && effectiveSrc && (
        <div className="border-t border-subtle bg-layer-1 p-1">
          <iframe
            src={`${effectiveSrc}#toolbar=0`}
            title={originalName || "PDF Viewer"}
            className="h-[520px] w-full rounded-lg bg-white"
          />
        </div>
      )}
    </div>
  );
}
