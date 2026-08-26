/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useEffect, useState } from "react";
import { BookOpen, FileText, Hash } from "lucide-react";
import type { EditorRefApi } from "@plane/editor";
import { cn } from "@plane/utils";

type Props = {
  editorRef: React.RefObject<EditorRefApi>;
  className?: string;
};

export const PageDocumentStats: React.FC<Props> = ({ editorRef, className }) => {
  const [stats, setStats] = useState({ words: 0, characters: 0, readingTime: 1 });

  useEffect(() => {
    const updateStats = () => {
      const editor = editorRef.current?.editor;
      if (!editor) return;

      const words = editor.storage?.characterCount?.words?.() ?? 0;
      const characters = editor.storage?.characterCount?.characters?.() ?? 0;
      const readingTime = Math.max(1, Math.ceil(words / 200));

      setStats({ words, characters, readingTime });
    };

    updateStats();

    const editor = editorRef.current?.editor;
    if (editor) {
      editor.on("update", updateStats);
      editor.on("selectionUpdate", updateStats);
    }

    const interval = setInterval(updateStats, 2000);

    return () => {
      if (editor) {
        editor.off("update", updateStats);
        editor.off("selectionUpdate", updateStats);
      }
      clearInterval(interval);
    };
  }, [editorRef]);

  if (stats.characters === 0) return null;

  return (
    <div
      className={cn(
        "flex select-none items-center justify-center gap-4 py-6 text-xs text-tertiary transition-opacity duration-200 hover:text-secondary",
        className
      )}
    >
      <div className="flex items-center gap-1.5" title="زمان تقریبی مطالعه">
        <BookOpen className="h-3.5 w-3.5 opacity-70" />
        <span>{stats.readingTime} دقیقه مطالعه</span>
      </div>
      <span className="text-subtle">•</span>
      <div className="flex items-center gap-1.5" title="تعداد کلمات">
        <FileText className="h-3.5 w-3.5 opacity-70" />
        <span>{stats.words.toLocaleString("fa-IR")} کلمه</span>
      </div>
      <span className="text-subtle">•</span>
      <div className="flex items-center gap-1.5" title="تعداد کاراکترها">
        <Hash className="h-3.5 w-3.5 opacity-70" />
        <span>{stats.characters.toLocaleString("fa-IR")} کاراکتر</span>
      </div>
    </div>
  );
};
