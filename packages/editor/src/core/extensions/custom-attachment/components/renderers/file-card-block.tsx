/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState, useCallback, useMemo } from "react";
import { Download, ExternalLink, Copy, Check } from "lucide-react";
// plane imports
import { cn } from "@plane/utils";
// local imports
import { FILE_CATEGORY_META, getFileCategory, getFileExtension } from "../../helpers/file-category";
import { formatBytes, getAttachmentBlockId, isAttachmentDuplicating } from "../../utils";
import type { CustomAttachmentNodeViewProps } from "../node-view";

interface FileCardBlockProps extends CustomAttachmentNodeViewProps {
  downloadSrc: string | undefined;
}

export function FileCardBlock(props: FileCardBlockProps) {
  const { editor, getPos, node, selected, downloadSrc } = props;
  const { id, originalName, size, status, src } = node.attrs;
  const isDuplicating = isAttachmentDuplicating(status);
  const [copied, setCopied] = useState(false);

  const effectiveSrc = useMemo(() => {
    if (downloadSrc) return downloadSrc;
    if (src && (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("blob:"))) {
      return src;
    }
    return undefined;
  }, [downloadSrc, src]);

  const category = useMemo(() => getFileCategory(originalName), [originalName]);
  const extension = useMemo(() => getFileExtension(originalName).toUpperCase(), [originalName]);
  const meta = useMemo(() => FILE_CATEGORY_META[category] || FILE_CATEGORY_META.generic, [category]);
  const IconComponent = meta.icon;

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
        const a = document.createElement("a");
        a.href = effectiveSrc;
        a.download = originalName || "file";
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
      data-drag-handle
      className={cn(
        "group my-2 flex w-full max-w-md cursor-pointer items-center justify-between rounded-xl border border-subtle bg-layer-2 p-3 transition-all select-none",
        {
          "ring-accent-primary border-transparent ring-2": selected && editor.isEditable,
          "hover:border-strong hover:bg-layer-2-hover": !selected,
          "pointer-events-none opacity-50": isDuplicating,
        }
      )}
      onClick={handleBlockClick}
      onDoubleClick={handleDownload}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        {/* Category Icon Badge */}
        <div
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-lg transition-transform group-hover:scale-105",
            meta.badgeBg,
            meta.iconColor
          )}
        >
          <IconComponent className="h-5 w-5" />
        </div>

        {/* File Details */}
        <div className="flex flex-col overflow-hidden">
          <div className="flex items-center gap-2">
            <span className="text-sm truncate font-semibold text-primary">{originalName || "Attachment"}</span>
            {extension ? (
              <span
                className={cn("py-0.2 rounded px-1.5 text-[10px] font-bold uppercase", meta.badgeBg, meta.badgeText)}
              >
                {extension}
              </span>
            ) : null}
          </div>
          <span className="text-xs text-tertiary">{size ? formatBytes(size) : meta.label}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 pl-2">
        {effectiveSrc && (
          <>
            <button
              type="button"
              className="grid h-8 w-8 place-items-center rounded-md text-tertiary transition-colors hover:bg-layer-3 hover:text-primary"
              onClick={handleCopy}
              title="کپی لینک"
            >
              {copied ? <Check className="text-emerald-500 h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
            <button
              type="button"
              className="grid h-8 w-8 place-items-center rounded-md text-tertiary transition-colors hover:bg-layer-3 hover:text-primary"
              onClick={handleDownload}
              title="دانلود فایل"
            >
              <Download className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
