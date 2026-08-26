/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import { ExternalLink, Globe, Play, Edit2, Check, Video } from "lucide-react";
import React, { useState, useCallback, useRef, useEffect } from "react";
// plane imports
import { cn } from "@plane/utils";
// types
import type { TEmbedAttributes } from "../types";
import { EEmbedAttributeNames } from "../types";

export type CustomEmbedNodeViewProps = NodeViewProps & {
  node: NodeViewProps["node"] & {
    attrs: TEmbedAttributes;
  };
  updateAttributes: (attrs: Partial<TEmbedAttributes>) => void;
};

export const transformToEmbedUrl = (
  rawUrl: string,
  preferredProvider?: string
): { embedUrl: string; provider: TEmbedAttributes[EEmbedAttributeNames.PROVIDER] } => {
  const url = rawUrl.trim();

  // YouTube
  if (url.includes("youtube.com/watch") || url.includes("youtu.be")) {
    let videoId = "";
    if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split("?")[0] ?? "";
    } else if (url.includes("v=")) {
      videoId = url.split("v=")[1]?.split("&")[0] ?? "";
    }
    if (videoId) {
      return {
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
        provider: "youtube",
      };
    }
  }

  // Aparat
  if (url.includes("aparat.com/v/")) {
    const videoHash = url.split("aparat.com/v/")[1]?.split("/")[0]?.split("?")[0] ?? "";
    if (videoHash) {
      return {
        embedUrl: `https://www.aparat.com/video/video/embed/videohash/${videoHash}/vt/frame`,
        provider: "aparat",
      };
    }
  }

  // Figma
  if (url.includes("figma.com")) {
    return {
      embedUrl: `https://www.figma.com/embed?embed_host=plane&url=${encodeURIComponent(url)}`,
      provider: "figma",
    };
  }

  // CodePen
  if (url.includes("codepen.io") && url.includes("/pen/")) {
    const embedUrl = url.replace("/pen/", "/embed/");
    return {
      embedUrl: `${embedUrl}?default-tab=result`,
      provider: "codepen",
    };
  }

  // Spotify
  if (url.includes("open.spotify.com")) {
    const embedUrl = url.replace("open.spotify.com/", "open.spotify.com/embed/");
    return {
      embedUrl,
      provider: "spotify",
    };
  }

  // SoundCloud
  if (url.includes("soundcloud.com")) {
    return {
      embedUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=true`,
      provider: "soundcloud",
    };
  }

  const provider = (preferredProvider as TEmbedAttributes[EEmbedAttributeNames.PROVIDER]) || "generic";
  return { embedUrl: url, provider };
};

export function CustomEmbedBlock(props: CustomEmbedNodeViewProps) {
  const { editor, node, updateAttributes, selected } = props;
  const src = node.attrs[EEmbedAttributeNames.SRC] || "";
  const originalUrl = node.attrs[EEmbedAttributeNames.ORIGINAL_URL] || "";
  const provider = node.attrs[EEmbedAttributeNames.PROVIDER] || "generic";

  const [isEditing, setIsEditing] = useState(!src);
  const [inputUrl, setInputUrl] = useState(originalUrl || src);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = useCallback(() => {
    if (!inputUrl.trim()) return;
    const { embedUrl, provider: detectedProvider } = transformToEmbedUrl(inputUrl, provider);
    updateAttributes({
      [EEmbedAttributeNames.SRC]: embedUrl,
      [EEmbedAttributeNames.ORIGINAL_URL]: inputUrl.trim(),
      [EEmbedAttributeNames.PROVIDER]: detectedProvider,
    });
    setIsEditing(false);
  }, [inputUrl, provider, updateAttributes]);

  const providerTitle = {
    youtube: "YouTube Video",
    aparat: "Aparat Video",
    figma: "Figma Prototype",
    codepen: "CodePen",
    spotify: "Spotify Audio",
    soundcloud: "SoundCloud Audio",
    generic: "Web Embed",
  }[provider] || "Web Embed";

  return (
    <NodeViewWrapper className="editor-embed-component my-4 select-none">
      <div
        contentEditable={false}
        className={cn(
          "group relative flex w-full flex-col overflow-hidden rounded-xl border border-subtle bg-layer-1 shadow-sm transition-all",
          {
            "ring-2 ring-accent-primary border-transparent": selected && editor.isEditable,
            "hover:border-strong": !selected && !isEditing,
          }
        )}
      >
        {!isEditing && src ? (
          <>
            {/* Top Toolbar */}
            <div className="flex items-center justify-between border-b border-subtle bg-layer-2 px-3 py-1.5 text-xs text-tertiary">
              <div className="flex items-center gap-2 font-medium text-secondary">
                {provider === "youtube" || provider === "aparat" ? (
                  <Video className="h-3.5 w-3.5 text-red-500" />
                ) : (
                  <Globe className="h-3.5 w-3.5 text-accent-primary" />
                )}
                <span>{providerTitle}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {editor.isEditable && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="grid h-6 w-6 place-items-center rounded text-tertiary transition hover:bg-layer-3 hover:text-primary"
                    title="ویرایش آدرس"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                )}
                {originalUrl && (
                  <a
                    href={originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="grid h-6 w-6 place-items-center rounded text-tertiary transition hover:bg-layer-3 hover:text-primary"
                    title="باز کردن در تب جدید"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>

            {/* iFrame Container */}
            <div className="relative aspect-video w-full bg-black/5">
              <iframe
                src={src}
                title={providerTitle}
                className="size-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </>
        ) : (
          /* Edit / Input Mode */
          <div className="flex w-full flex-col gap-2.5 p-4 bg-layer-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <Globe className="h-4 w-4 text-accent-primary" />
              <span>جاسازی تعاملی (Embed Web Content / Video)</span>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                ref={inputRef}
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                }}
                placeholder="آدرس یوتیوب، آپارات، فیگما، کدپن یا لینک وبسایت..."
                className="flex-1 rounded-lg border border-subtle bg-layer-1 px-3 py-1.5 text-xs text-primary placeholder:text-tertiary focus:border-accent-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSave}
                className="shrink-0 rounded-lg bg-accent-primary px-4 py-1.5 text-xs font-medium text-white shadow transition hover:bg-accent-primary/90"
              >
                جاسازی
              </button>
            </div>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}
