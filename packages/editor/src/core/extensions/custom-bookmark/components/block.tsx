/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState, useCallback, useMemo } from "react";
import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import { ExternalLink, Globe, Link2, Copy, Check, ArrowRight } from "lucide-react";
// plane imports
import { cn } from "@plane/utils";
// local imports
import type { CustomBookmarkExtensionType, TCustomBookmarkAttributes } from "../types";

export type CustomBookmarkNodeViewProps = Omit<NodeViewProps, "extension" | "updateAttributes"> & {
  extension: CustomBookmarkExtensionType;
  node: NodeViewProps["node"] & {
    attrs: TCustomBookmarkAttributes;
  };
  updateAttributes: (attrs: Partial<TCustomBookmarkAttributes>) => void;
};

const extractDomain = (url?: string | null): string => {
  if (!url) return "";
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

export function CustomBookmarkBlock(props: CustomBookmarkNodeViewProps) {
  const { editor, getPos, node, selected, updateAttributes } = props;
  const { url, title, description } = node.attrs;

  const [inputUrl, setInputUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const domain = useMemo(() => extractDomain(url), [url]);
  const faviconUrl = useMemo(() => {
    if (!domain) return null;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  }, [domain]);

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

  const handleOpenLink = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (url) {
        const targetUrl = url.startsWith("http") ? url : `https://${url}`;
        window.open(targetUrl, "_blank", "noopener,noreferrer");
      }
    },
    [url]
  );

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (url) {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    },
    [url]
  );

  const handleSubmitUrl = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputUrl.trim()) return;

      let validUrl = inputUrl.trim();
      if (!validUrl.startsWith("http://") && !validUrl.startsWith("https://")) {
        validUrl = `https://${validUrl}`;
      }

      const extracted = extractDomain(validUrl);
      updateAttributes({
        url: validUrl,
        title: extracted ? extracted.charAt(0).toUpperCase() + extracted.slice(1) : validUrl,
        description: validUrl,
      });
    },
    [inputUrl, updateAttributes]
  );

  // If no URL is set yet, show an interactive prompt input
  if (!url) {
    return (
      <NodeViewWrapper>
        <div
          data-drag-handle
          className={cn(
            "my-2 flex w-full max-w-xl items-center gap-2 rounded-xl border border-subtle bg-layer-2 p-2 transition-all",
            {
              "ring-2 ring-accent-primary border-transparent": selected && editor.isEditable,
            }
          )}
          onClick={handleBlockClick}
        >
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-primary/10 text-accent-primary">
            <Link2 className="h-4 w-4" />
          </div>
          <form onSubmit={handleSubmitUrl} className="flex flex-1 items-center gap-2">
            <input
              type="text"
              autoFocus
              placeholder="Paste web link (e.g. https://github.com)..."
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="flex-1 bg-transparent text-sm text-primary placeholder:text-tertiary focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputUrl.trim()}
              className="flex items-center gap-1 rounded-lg bg-accent-primary px-3 py-1 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <span>Bookmark</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </NodeViewWrapper>
    );
  }

  // Render Notion-style rich bookmark card
  return (
    <NodeViewWrapper>
      <div
        data-drag-handle
        className={cn(
          "group my-2 flex w-full max-w-2xl items-stretch justify-between overflow-hidden rounded-xl border border-subtle bg-layer-2 transition-all cursor-pointer select-none",
          {
            "ring-2 ring-accent-primary border-transparent": selected && editor.isEditable,
            "hover:border-strong hover:bg-layer-2-hover": !selected,
          }
        )}
        onClick={handleBlockClick}
        onDoubleClick={handleOpenLink}
      >
        {/* Left column: Info */}
        <div className="flex flex-1 flex-col justify-between p-3.5 overflow-hidden">
          <div className="flex flex-col gap-1 overflow-hidden">
            <span className="truncate text-sm font-semibold text-primary">
              {title || domain || url}
            </span>
            <span className="line-clamp-2 text-xs text-tertiary">
              {description || url}
            </span>
          </div>

          {/* Bottom domain badge & actions */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              {faviconUrl ? (
                <img
                  src={faviconUrl}
                  alt=""
                  className="h-4 w-4 rounded-sm object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                <Globe className="h-3.5 w-3.5 text-tertiary" />
              )}
              <span className="truncate text-xs font-medium text-secondary">
                {domain}
              </span>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={handleCopy}
                className="grid h-7 w-7 place-items-center rounded text-tertiary transition-colors hover:bg-layer-3 hover:text-primary"
                title="Copy link"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                onClick={handleOpenLink}
                className="grid h-7 w-7 place-items-center rounded text-tertiary transition-colors hover:bg-layer-3 hover:text-primary"
                title="Open in new tab"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right column: Visual icon card */}
        <div className="flex w-24 shrink-0 items-center justify-center border-l border-subtle bg-layer-1 text-tertiary transition-colors group-hover:text-primary sm:w-28">
          <Globe className="h-7 w-7 stroke-[1.5]" />
        </div>
      </div>
    </NodeViewWrapper>
  );
}
