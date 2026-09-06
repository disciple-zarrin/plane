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
  editorRef: React.RefObject<EditorRefApi | null>;
  className?: string;
};

export const PageDocumentStats: React.FC<Props> = ({ editorRef, className }) => {
  const [stats, setStats] = useState({ words: 0, characters: 0, readingTime: 1 });

  useEffect(() => {
    const handleInfoChange = (info: { words: number; characters: number }) => {
      const words = info?.words ?? 0;
      const characters = info?.characters ?? 0;
      const readingTime = Math.max(1, Math.ceil(words / 200));
      setStats({ words, characters, readingTime });
    };

    if (editorRef.current?.getDocumentInfo) {
      handleInfoChange(editorRef.current.getDocumentInfo());
    }

    const unsubscribe = editorRef.current?.onDocumentInfoChange?.(handleInfoChange);

    return () => {
      unsubscribe?.();
    };
  }, [editorRef]);

  if (stats.characters === 0) return null;

  return (
    <div
      className={cn(
        "text-xs flex items-center justify-center gap-4 py-6 text-tertiary transition-opacity duration-200 select-none hover:text-secondary",
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
