/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import { ExternalLink, Globe, Edit2, Video, GitFork, Code, Music } from "lucide-react";
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

  // Loom
  if (url.includes("loom.com/share/")) {
    const videoId = url.split("loom.com/share/")[1]?.split("?")[0] ?? "";
    if (videoId) {
      return {
        embedUrl: `https://www.loom.com/embed/${videoId}`,
        provider: "loom",
      };
    }
  }

  // Vimeo
  if (url.includes("vimeo.com/")) {
    const videoId = url.split("vimeo.com/")[1]?.split(/[?#/]/)[0] ?? "";
    if (videoId && !isNaN(Number(videoId))) {
      return {
        embedUrl: `https://player.vimeo.com/video/${videoId}`,
        provider: "vimeo",
      };
    }
  }

  // Direct Video files (.mp4, .webm, .mov)
  if (/\.(mp4|webm|mov)(\?.*)?$/i.test(url)) {
    return {
      embedUrl: url,
      provider: "video",
    };
  }

  // Direct Audio files (.mp3, .wav, .ogg, .aac)
  if (/\.(mp3|wav|ogg|aac)(\?.*)?$/i.test(url)) {
    return {
      embedUrl: url,
      provider: "audio",
    };
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

  // GitHub Gist
  if (url.includes("gist.github.com")) {
    return {
      embedUrl: url,
      provider: "gist",
    };
  }

  // GitHub Repo
  if (url.includes("github.com")) {
    return {
      embedUrl: url,
      provider: "github",
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

  const providerTitle =
    {
      youtube: "YouTube Video",
      aparat: "Aparat Video",
      loom: "Loom Video",
      vimeo: "Vimeo Video",
      video: "Direct Video Player",
      audio: "Direct Audio Player",
      figma: "Figma Prototype",
      codepen: "CodePen",
      spotify: "Spotify Audio",
      soundcloud: "SoundCloud Audio",
      github: "GitHub Repository",
      gist: "GitHub Gist",
      generic: "Web Embed",
    }[provider] || "Web Embed";

  // Parse repo path for github display
  const githubRepoPath =
    provider === "github" && originalUrl.includes("github.com/")
      ? (originalUrl.split("github.com/")[1]?.split(/[?#]/)[0] ?? originalUrl)
      : originalUrl;

  const gistId =
    provider === "gist" && originalUrl.includes("gist.github.com/")
      ? (originalUrl.split("gist.github.com/")[1]?.split(/[?#]/)[0] ?? originalUrl)
      : originalUrl;

  const isAudio = provider === "spotify" || provider === "soundcloud" || provider === "audio";
  const isDirectVideo = provider === "video";
  const isGithubCard = provider === "github" || provider === "gist";

  return (
    <NodeViewWrapper className="editor-embed-component my-4 select-none">
      <div
        contentEditable={false}
        className={cn(
          "group shadow-sm relative flex w-full flex-col overflow-hidden rounded-xl border border-subtle bg-layer-1 transition-all",
          {
            "ring-accent-primary border-transparent ring-2": selected && editor.isEditable,
            "hover:border-strong": !selected && !isEditing,
          }
        )}
      >
        {!isEditing && src ? (
          <>
            {/* Top Toolbar */}
            <div className="text-xs flex items-center justify-between border-b border-subtle bg-layer-2 px-3 py-1.5 text-tertiary">
              <div className="flex items-center gap-2 font-medium text-secondary">
                {provider === "youtube" ||
                provider === "aparat" ||
                provider === "loom" ||
                provider === "vimeo" ||
                provider === "video" ? (
                  <Video className="text-red-500 h-3.5 w-3.5" />
                ) : isAudio ? (
                  <Music className="text-green-500 h-3.5 w-3.5" />
                ) : provider === "github" ? (
                  <GitFork className="text-slate-700 dark:text-slate-200 h-3.5 w-3.5" />
                ) : provider === "gist" ? (
                  <Code className="text-slate-700 dark:text-slate-200 h-3.5 w-3.5" />
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

            {/* Content Display */}
            {isGithubCard ? (
              <div className="flex items-center justify-between gap-4 bg-layer-1 p-4 transition-colors hover:bg-layer-2">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-subtle bg-layer-2">
                    {provider === "github" ? (
                      <GitFork className="h-5 w-5 text-primary" />
                    ) : (
                      <Code className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <span className="text-sm truncate font-semibold text-primary">
                      {provider === "github" ? githubRepoPath : `Gist: ${gistId}`}
                    </span>
                    <span className="text-xs truncate text-tertiary">{originalUrl}</span>
                  </div>
                </div>
                <a
                  href={originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs flex shrink-0 items-center gap-1.5 rounded-lg border border-subtle bg-layer-2 px-3 py-1.5 font-medium text-secondary transition hover:bg-layer-3 hover:text-primary"
                >
                  <span>مشاهده در GitHub</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            ) : isDirectVideo ? (
              <div className="relative aspect-video w-full bg-black">
                <video src={src} controls playsInline preload="metadata" className="size-full object-contain" />
              </div>
            ) : provider === "audio" ? (
              <div className="flex w-full items-center bg-layer-1 p-3">
                <audio src={src} controls className="w-full" />
              </div>
            ) : isAudio ? (
              <div className="relative h-40 w-full bg-black/5">
                <iframe
                  src={src}
                  title={providerTitle}
                  className="size-full border-0"
                  sandbox="allow-scripts allow-presentation allow-popups allow-forms"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="relative aspect-video w-full bg-black/5">
                <iframe
                  src={src}
                  title={providerTitle}
                  className="size-full border-0"
                  sandbox="allow-scripts allow-presentation allow-popups allow-forms"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            )}
          </>
        ) : (
          /* Edit / Input Mode */
          <div
            className="flex w-full flex-col gap-2.5 bg-layer-2 p-4"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xs flex items-center gap-2 font-semibold text-primary">
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
                  e.stopPropagation();
                  if (e.key === "Enter") handleSave();
                }}
                placeholder="آدرس یوتیوب، آپارات، لوم، ویمو، فیگما، کدپن یا لینک مستقیم ویدیو/صوت..."
                className="text-xs focus:border-accent-primary flex-1 rounded-lg border border-subtle bg-layer-1 px-3 py-1.5 text-primary placeholder:text-tertiary focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSave}
                className="text-xs shadow shrink-0 rounded-lg bg-accent-primary px-4 py-1.5 font-medium text-white transition hover:bg-accent-primary/90"
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
