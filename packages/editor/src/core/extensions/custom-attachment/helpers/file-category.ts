/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import {
  FileText,
  FileSpreadsheet,
  FileArchive,
  FileCode,
  FileAudio,
  FileVideo,
  File,
  Presentation,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type TFileCategory =
  | "video"
  | "audio"
  | "pdf"
  | "document"
  | "sheet"
  | "presentation"
  | "archive"
  | "code"
  | "generic";

export interface IFileCategoryMeta {
  category: TFileCategory;
  label: string;
  icon: LucideIcon;
  badgeBg: string;
  badgeText: string;
  badgeBorder?: string;
  iconColor: string;
  isMedia: boolean;
  isPreviewable: boolean;
}

const EXTENSION_CATEGORY_MAP: Record<string, TFileCategory> = {
  // Video
  mp4: "video",
  webm: "video",
  ogg: "video",
  mov: "video",
  mkv: "video",
  avi: "video",
  wmv: "video",
  flv: "video",
  m4v: "video",

  // Audio
  mp3: "audio",
  wav: "audio",
  m4a: "audio",
  aac: "audio",
  flac: "audio",
  midi: "audio",
  mid: "audio",
  wma: "audio",

  // PDF
  pdf: "pdf",

  // Documents
  doc: "document",
  docx: "document",
  rtf: "document",
  odt: "document",
  txt: "document",
  md: "document",
  markdown: "document",

  // Sheets / Tabular
  xls: "sheet",
  xlsx: "sheet",
  csv: "sheet",
  tsv: "sheet",
  ods: "sheet",

  // Presentations
  ppt: "presentation",
  pptx: "presentation",
  odp: "presentation",
  key: "presentation",

  // Archives
  zip: "archive",
  rar: "archive",
  "7z": "archive",
  tar: "archive",
  gz: "archive",
  gzip: "archive",
  bz2: "archive",

  // Code & Config
  js: "code",
  jsx: "code",
  ts: "code",
  tsx: "code",
  html: "code",
  css: "code",
  scss: "code",
  json: "code",
  xml: "code",
  yaml: "code",
  yml: "code",
  py: "code",
  java: "code",
  c: "code",
  cpp: "code",
  cs: "code",
  go: "code",
  rs: "code",
  php: "code",
  rb: "code",
  sh: "code",
  sql: "code",
};

const MIME_CATEGORY_PREFIX_MAP: Record<string, TFileCategory> = {
  "video/": "video",
  "audio/": "audio",
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml": "document",
  "application/msword": "document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml": "sheet",
  "application/vnd.ms-excel": "sheet",
  "text/csv": "sheet",
  "application/vnd.openxmlformats-officedocument.presentationml": "presentation",
  "application/vnd.ms-powerpoint": "presentation",
  "application/zip": "archive",
  "application/x-rar-compressed": "archive",
  "application/x-tar": "archive",
  "application/gzip": "archive",
  "text/javascript": "code",
  "application/json": "code",
  "text/css": "code",
  "text/xml": "code",
  "text/plain": "document",
};

export const getFileExtension = (filename?: string | null): string => {
  if (!filename) return "";
  const parts = filename.split(".");
  return parts.length > 1 ? (parts.pop()?.toLowerCase() ?? "") : "";
};

export const getFileCategory = (filename?: string | null, mimeType?: string | null): TFileCategory => {
  // Check extension first
  const ext = getFileExtension(filename);
  if (ext && EXTENSION_CATEGORY_MAP[ext]) {
    return EXTENSION_CATEGORY_MAP[ext];
  }

  // Check MIME type
  if (mimeType) {
    for (const [prefix, cat] of Object.entries(MIME_CATEGORY_PREFIX_MAP)) {
      if (mimeType.startsWith(prefix)) {
        return cat;
      }
    }
  }

  return "generic";
};

export const FILE_CATEGORY_META: Record<TFileCategory, IFileCategoryMeta> = {
  video: {
    category: "video",
    label: "Video",
    icon: FileVideo,
    badgeBg: "bg-indigo-500/10 dark:bg-indigo-400/10",
    badgeText: "text-indigo-600 dark:text-indigo-400",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    isMedia: true,
    isPreviewable: true,
  },
  audio: {
    category: "audio",
    label: "Audio",
    icon: FileAudio,
    badgeBg: "bg-pink-500/10 dark:bg-pink-400/10",
    badgeText: "text-pink-600 dark:text-pink-400",
    iconColor: "text-pink-600 dark:text-pink-400",
    isMedia: true,
    isPreviewable: true,
  },
  pdf: {
    category: "pdf",
    label: "PDF",
    icon: FileText,
    badgeBg: "bg-red-500/10 dark:bg-red-400/10",
    badgeText: "text-red-600 dark:text-red-400",
    iconColor: "text-red-600 dark:text-red-400",
    isMedia: false,
    isPreviewable: true,
  },
  document: {
    category: "document",
    label: "Document",
    icon: FileText,
    badgeBg: "bg-blue-500/10 dark:bg-blue-400/10",
    badgeText: "text-blue-600 dark:text-blue-400",
    iconColor: "text-blue-600 dark:text-blue-400",
    isMedia: false,
    isPreviewable: false,
  },
  sheet: {
    category: "sheet",
    label: "Spreadsheet",
    icon: FileSpreadsheet,
    badgeBg: "bg-emerald-500/10 dark:bg-emerald-400/10",
    badgeText: "text-emerald-600 dark:text-emerald-400",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    isMedia: false,
    isPreviewable: false,
  },
  presentation: {
    category: "presentation",
    label: "Presentation",
    icon: Presentation,
    badgeBg: "bg-amber-500/10 dark:bg-amber-400/10",
    badgeText: "text-amber-600 dark:text-amber-400",
    iconColor: "text-amber-600 dark:text-amber-400",
    isMedia: false,
    isPreviewable: false,
  },
  archive: {
    category: "archive",
    label: "Archive",
    icon: FileArchive,
    badgeBg: "bg-purple-500/10 dark:bg-purple-400/10",
    badgeText: "text-purple-600 dark:text-purple-400",
    iconColor: "text-purple-600 dark:text-purple-400",
    isMedia: false,
    isPreviewable: false,
  },
  code: {
    category: "code",
    label: "Code",
    icon: FileCode,
    badgeBg: "bg-teal-500/10 dark:bg-teal-400/10",
    badgeText: "text-teal-600 dark:text-teal-400",
    iconColor: "text-teal-600 dark:text-teal-400",
    isMedia: false,
    isPreviewable: false,
  },
  generic: {
    category: "generic",
    label: "File",
    icon: File,
    badgeBg: "bg-gray-500/10 dark:bg-gray-400/10",
    badgeText: "text-gray-600 dark:text-gray-400",
    iconColor: "text-gray-600 dark:text-gray-400",
    isMedia: false,
    isPreviewable: false,
  },
};
