/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import { FileText, ArrowUpRight, Edit2, Check, X } from "lucide-react";
import React, { useState, useCallback, useRef, useEffect } from "react";
// plane imports
import { cn } from "@plane/utils";
// types
import type { TPageLinkAttributes } from "../types";
import { EPageLinkAttributeNames } from "../types";

export type CustomPageLinkNodeViewProps = NodeViewProps & {
  node: NodeViewProps["node"] & {
    attrs: TPageLinkAttributes;
  };
  updateAttributes: (attrs: Partial<TPageLinkAttributes>) => void;
};

export function CustomPageLinkBlock(props: CustomPageLinkNodeViewProps) {
  const { editor, node, updateAttributes, selected } = props;
  const title = node.attrs[EPageLinkAttributeNames.TITLE] || "";
  const url = node.attrs[EPageLinkAttributeNames.URL] || "";

  const [isEditing, setIsEditing] = useState(!url && !title);
  const [tempTitle, setTempTitle] = useState(title);
  const [tempUrl, setTempUrl] = useState(url);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTempTitle(title);
    setTempUrl(url);
  }, [title, url]);

  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = useCallback(() => {
    let finalTitle = tempTitle.trim();
    let finalUrl = tempUrl.trim();

    if (!finalTitle && !finalUrl) {
      return;
    }

    if (!finalTitle && finalUrl) {
      finalTitle = finalUrl.replace(/^https?:\/\//, "").split("/")[0] || "Page Link";
    }

    updateAttributes({
      [EPageLinkAttributeNames.TITLE]: finalTitle || "Untitled Page",
      [EPageLinkAttributeNames.URL]: finalUrl,
    });
    setIsEditing(false);
  }, [tempTitle, tempUrl, updateAttributes]);

  const handleCancel = useCallback(() => {
    if (title || url) {
      setTempTitle(title);
      setTempUrl(url);
      setIsEditing(false);
    }
  }, [title, url]);

  return (
    <NodeViewWrapper className="editor-page-link-component my-2 select-none">
      {!isEditing && (title || url) ? (
        <div
          className={cn(
            "group flex w-full max-w-xl items-center justify-between rounded-xl border border-subtle bg-layer-2 p-3 transition-all",
            {
              "ring-accent-primary border-transparent ring-2": selected && editor.isEditable,
              "hover:border-strong hover:bg-layer-2-hover": !selected,
            }
          )}
        >
          {/* View Mode */}
          <a
            href={url || "#"}
            target={url.startsWith("http") ? "_blank" : undefined}
            rel="noopener noreferrer"
            onClick={(e) => {
              if (!url) e.preventDefault();
            }}
            className="flex flex-1 cursor-pointer items-center gap-3 overflow-hidden text-start"
          >
            <div className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 grid h-9 w-9 shrink-0 place-items-center rounded-lg">
              <FileText className="h-4 w-4" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm truncate font-semibold text-primary underline-offset-2 group-hover:underline">
                {title || "Untitled Page"}
              </span>
              {url ? <span className="truncate text-[11px] text-tertiary">{url}</span> : null}
            </div>
          </a>

          <div className="flex items-center gap-1 ps-2">
            {editor.isEditable && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="grid h-7 w-7 place-items-center rounded text-tertiary opacity-0 transition group-hover:opacity-100 hover:bg-layer-3 hover:text-primary"
                title="ویرایش پیوند"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
            )}
            <ArrowUpRight className="h-4 w-4 text-tertiary transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
          </div>
        </div>
      ) : (
        /* Edit Mode */
        <div className="flex w-full max-w-xl flex-col gap-2.5 rounded-xl border border-subtle bg-layer-2 p-3.5">
          <div className="text-xs flex items-center justify-between font-semibold text-primary">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-accent-primary" />
              <span>ایجاد پیوند به صفحه (Link to Page)</span>
            </div>
            {(title || url) && (
              <button type="button" onClick={handleCancel} className="text-tertiary hover:text-primary" title="انصراف">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              ref={titleInputRef}
              type="text"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              placeholder="عنوان صفحه یا سند..."
              className="text-xs focus:border-accent-primary flex-1 rounded-lg border border-subtle bg-layer-1 px-3 py-2 text-primary placeholder:text-tertiary focus:outline-none"
            />
            <input
              type="text"
              value={tempUrl}
              onChange={(e) => setTempUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
              placeholder="آدرس صفحه (URL)..."
              className="text-xs focus:border-accent-primary flex-1 rounded-lg border border-subtle bg-layer-1 px-3 py-2 text-primary placeholder:text-tertiary focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSave}
              className="text-xs shadow flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-accent-primary px-4 py-2 font-medium text-white transition hover:bg-accent-primary/90"
            >
              <Check className="h-3.5 w-3.5" />
              <span>ثبت</span>
            </button>
          </div>
        </div>
      )}
    </NodeViewWrapper>
  );
}
