/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { diffLines } from "diff";
import { cn } from "@plane/utils";
import { stripHtmlToText } from "@/components/pages/export/tree-utils";

type Props = {
  beforeHtml: string;
  afterHtml: string;
  className?: string;
};

/** Notion-like green/red line diff of stripped document text. */
export function DocumentHtmlDiff(props: Props) {
  const { beforeHtml, afterHtml, className } = props;
  const before = stripHtmlToText(beforeHtml);
  const after = stripHtmlToText(afterHtml);
  const parts = diffLines(before, after);

  return (
    <pre
      className={cn(
        "max-h-[420px] overflow-auto rounded-md border border-subtle bg-surface-1 p-3 text-11 leading-5 whitespace-pre-wrap break-words",
        className
      )}
      dir="auto"
    >
      {parts.map((part) => {
        const key = `${part.added ? "a" : part.removed ? "r" : "k"}:${part.value.slice(0, 24)}:${part.count ?? 0}`;
        return (
          <span
            key={key}
            className={cn(
              part.added && "bg-green-500/20 text-green-800 dark:text-green-200",
              part.removed && "bg-red-500/20 text-red-800 dark:text-red-200 line-through"
            )}
          >
            {part.value}
          </span>
        );
      })}
    </pre>
  );
}
