/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import { FileText, ArrowUpRight, Check, Edit2 } from "lucide-react";
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
  const title = node.attrs[EPageLinkAttributeNames.TITLE] || "Untitled Page";
  const url = node.attrs[EPageLinkAttributeNames.URL] || "";

  const [isEditing, setIsEditing] = useState(!url);
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
    updateAttributes({
      [EPageLinkAttributeNames.TITLE]: tempTitle.trim() || "Untitled Page",
      [EPageLinkAttributeNames.URL]: tempUrl.trim(),
    });
    setIsEditing(false);
  }, [tempTitle, tempUrl, updateAttributes]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isEditing) return;
      if (url) {
        window.open(url, "_blank");
      }
    },
    [isEditing, url]
  );

  return (
    <NodeViewWrapper className="editor-page-link-component my-2 select-none">
      <div
        contentEditable={false}
        onClick={handleClick}
        className={cn(
          "group flex w-full max-w-xl items-center justify-between rounded-xl border border-subtle bg-layer-2 p-3 transition-all cursor-pointer",
          {
            "ring-2 ring-accent-primary border-transparent": selected && editor.isEditable,
            "hover:border-strong hover:bg-layer-2-hover": !selected && !isEditing,
          }
        )}
      >
        {!isEditing ? (
          <>
            {/* View Mode */}
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <FileText className="h-4 w-4" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-sm font-semibold text-primary underline-offset-2 group-hover:underline">
                  {title}
                </span>
                {url ? (
                  <span className="truncate text-[11px] text-tertiary">
                    {url}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-1 pl-2">
              {editor.isEditable && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                  className="grid h-7 w-7 place-items-center rounded text-tertiary opacity-0 transition group-hover:opacity-100 hover:bg-layer-3 hover:text-primary"
                  title="ویرایش لینک"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              )}
              <ArrowUpRight className="h-4 w-4 text-tertiary transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
            </div>
          </>
        ) : (
          /* Edit Mode */
          <div
            className="flex w-full flex-col gap-2.5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <FileText className="h-4 w-4 text-accent-primary" />
              <span>ایجاد پیوند به صفحه (Link to Page)</span>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                ref={titleInputRef}
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                placeholder="عنوان صفحه..."
                className="flex-1 rounded-lg border border-subtle bg-layer-1 px-3 py-1.5 text-xs text-primary placeholder:text-tertiary focus:border-accent-primary focus:outline-none"
              />
              <input
                type="text"
                value={tempUrl}
                onChange={(e) => setTempUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                }}
                placeholder="آدرس صفحه (URL)..."
                className="flex-1 rounded-lg border border-subtle bg-layer-1 px-3 py-1.5 text-xs text-primary placeholder:text-tertiary focus:border-accent-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSave}
                className="shrink-0 rounded-lg bg-accent-primary px-3 py-1.5 text-xs font-medium text-white shadow transition hover:bg-accent-primary/90"
              >
                ثبت
              </button>
            </div>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}
