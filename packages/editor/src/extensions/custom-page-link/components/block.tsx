/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import { FileText, ArrowUpRight, Edit2, Check, X, Search, Loader2 } from "lucide-react";
import React, { useState, useCallback, useRef, useEffect } from "react";
// plane imports
import { cn } from "@plane/utils";
// types
import type { TMentionSection, TMentionSuggestion } from "@/types";
import type { TPageLinkAttributes } from "../types";
import { EPageLinkAttributeNames } from "../types";

export type CustomPageLinkNodeViewProps = NodeViewProps & {
  node: NodeViewProps["node"] & {
    attrs: TPageLinkAttributes;
  };
  updateAttributes: (attrs: Partial<TPageLinkAttributes>) => void;
};

export function CustomPageLinkBlock(props: CustomPageLinkNodeViewProps) {
  const { editor, extension, node, updateAttributes, selected } = props;
  const title = node.attrs[EPageLinkAttributeNames.TITLE] || "";
  const url = node.attrs[EPageLinkAttributeNames.URL] || "";

  const [isEditing, setIsEditing] = useState(!url && !title);
  const [tempTitle, setTempTitle] = useState(title);
  const [tempUrl, setTempUrl] = useState(url);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<TMentionSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const searchCallback = (
    extension?.options as
      | { mentionHandler?: { searchCallback?: (query: string) => Promise<TMentionSection[]> } }
      | undefined
  )?.mentionHandler?.searchCallback;

  useEffect(() => {
    setTempTitle(title);
    setTempUrl(url);
  }, [title, url]);

  useEffect(() => {
    if (isEditing) {
      if (searchCallback && searchInputRef.current) {
        searchInputRef.current.focus();
      } else if (titleInputRef.current) {
        titleInputRef.current.focus();
      }
    }
  }, [isEditing, searchCallback]);

  // Query suggestions when editing and searchCallback is available
  useEffect(() => {
    if (!isEditing) return;
    if (!searchCallback) return;

    let isMounted = true;
    setIsSearching(true);

    const timer = setTimeout(async () => {
      try {
        const sections: TMentionSection[] = await searchCallback(searchQuery);
        if (isMounted && Array.isArray(sections)) {
          const allItems = sections.flatMap((sec) => sec.items || []);
          setSuggestions(allItems);
        }
      } catch (err) {
        console.error("Error searching pages for page link:", err);
      } finally {
        if (isMounted) setIsSearching(false);
      }
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery, isEditing, extension?.options?.mentionHandler?.searchCallback]);

  const handleSelectSuggestion = useCallback(
    (item: TMentionSuggestion) => {
      const pageTitle = item.title || "Untitled Page";
      const pageUrl = item.entity_identifier ? `pages/${item.entity_identifier}` : "";
      updateAttributes({
        [EPageLinkAttributeNames.TITLE]: pageTitle,
        [EPageLinkAttributeNames.URL]: pageUrl,
      });
      setIsEditing(false);
    },
    [updateAttributes]
  );

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
    <NodeViewWrapper className="editor-page-link-component my-2">
      <div
        contentEditable={false}
        className="w-full"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
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
            {/* View Mode Link */}
            <a
              href={url || "#"}
              target={url.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              onMouseDown={(e) => e.stopPropagation()}
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
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
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
          /* Edit / Search Mode */
          <div className="shadow-sm flex w-full max-w-xl flex-col gap-3 rounded-xl border border-subtle bg-layer-2 p-3.5">
            <div className="text-xs flex items-center justify-between font-semibold text-primary">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-accent-primary" />
                <span>ایجاد پیوند به صفحه یا منشن (Link to Page)</span>
              </div>
              {(title || url) && (
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={handleCancel}
                  className="text-tertiary hover:text-primary"
                  title="انصراف"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Quick Page Search / Mention */}
            {searchCallback && (
              <div className="flex flex-col gap-1.5">
                <div className="relative flex items-center">
                  <Search className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-tertiary" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onMouseDown={(e) => e.stopPropagation()}
                    placeholder="جستجو و انتخاب از صفحات پروژه (@)..."
                    className="text-xs focus:border-accent-primary w-full rounded-lg border border-subtle bg-layer-1 py-1.5 ps-8 pe-3 text-primary placeholder:text-tertiary focus:outline-none"
                    onKeyDown={(e) => {
                      e.stopPropagation();
                    }}
                  />
                  {isSearching && (
                    <Loader2 className="absolute left-2.5 h-3.5 w-3.5 animate-spin text-accent-primary" />
                  )}
                </div>

                {/* Suggestions List */}
                {suggestions.length > 0 && (
                  <div className="max-h-36 overflow-y-auto rounded-lg border border-subtle bg-layer-1 p-1">
                    {suggestions.slice(0, 5).map((item) => (
                      <button
                        key={item.id || item.entity_identifier}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onClick={() => handleSelectSuggestion(item)}
                        className="text-xs flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start text-secondary transition-colors hover:bg-layer-2 hover:text-primary"
                      >
                        <div className="bg-indigo-500/10 text-indigo-600 grid h-5 w-5 shrink-0 place-items-center rounded">
                          {item.icon || <FileText className="h-3 w-3" />}
                        </div>
                        <span className="truncate font-medium">{item.title}</span>
                        {item.subTitle && <span className="ms-auto text-[10px] text-tertiary">{item.subTitle}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Manual Title & URL Fields */}
            <div className="flex flex-col gap-2 border-t border-subtle/50 pt-1 sm:flex-row">
              <input
                ref={titleInputRef}
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                placeholder="عنوان صفحه..."
                className="text-xs focus:border-accent-primary flex-1 rounded-lg border border-subtle bg-layer-1 px-3 py-2 text-primary placeholder:text-tertiary focus:outline-none"
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Enter") handleSave();
                }}
              />
              <input
                type="text"
                value={tempUrl}
                onChange={(e) => setTempUrl(e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                placeholder="آدرس صفحه (URL)..."
                className="text-xs focus:border-accent-primary flex-1 rounded-lg border border-subtle bg-layer-1 px-3 py-2 text-primary placeholder:text-tertiary focus:outline-none"
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Enter") handleSave();
                }}
              />
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={handleSave}
                className="text-xs shadow flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-accent-primary px-4 py-2 font-medium text-white transition hover:bg-accent-primary/90"
              >
                <Check className="h-3.5 w-3.5" />
                <span>ثبت</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}
