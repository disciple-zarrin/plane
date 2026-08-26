/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import { FileText, ArrowUpRight, Edit2 } from "lucide-react";
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

  return (
    <NodeViewWrapper className="editor-page-link-component my-2 select-none">
      {!isEditing ? (
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
            target="_blank"
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
                {title}
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
                title="ویرایش لینک"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
            )}
            <ArrowUpRight className="h-4 w-4 text-tertiary transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
          </div>
        </div>
      ) : (
        /* Edit Mode */
        <div className="flex w-full max-w-xl flex-col gap-2.5 rounded-xl border border-subtle bg-layer-2 p-3">
          <div className="text-xs flex items-center gap-2 font-semibold text-primary">
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
              className="text-xs focus:border-accent-primary flex-1 rounded-lg border border-subtle bg-layer-1 px-3 py-1.5 text-primary placeholder:text-tertiary focus:outline-none"
            />
            <input
              type="text"
              value={tempUrl}
              onChange={(e) => setTempUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
              placeholder="آدرس صفحه (URL)..."
              className="text-xs focus:border-accent-primary flex-1 rounded-lg border border-subtle bg-layer-1 px-3 py-1.5 text-primary placeholder:text-tertiary focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSave}
              className="text-xs shadow shrink-0 rounded-lg bg-accent-primary px-3 py-1.5 font-medium text-white transition hover:bg-accent-primary/90"
            >
              ثبت
            </button>
          </div>
        </div>
      )}
    </NodeViewWrapper>
  );
}
