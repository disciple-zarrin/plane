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

type DiffLine = {
  kind: "added" | "removed" | "unchanged";
  text: string;
};

function toUnifiedLines(before: string, after: string): { lines: DiffLine[]; added: number; removed: number } {
  const parts = diffLines(before, after);
  const lines: DiffLine[] = [];
  let added = 0;
  let removed = 0;

  for (const part of parts) {
    const kind: DiffLine["kind"] = part.added ? "added" : part.removed ? "removed" : "unchanged";
    const chunkLines = part.value.replace(/\n$/, "").split("\n");
    for (const text of chunkLines) {
      if (kind === "added") added += 1;
      if (kind === "removed") removed += 1;
      lines.push({ kind, text });
    }
  }

  return { lines, added, removed };
}

/** Git-like unified diff (+/−) of stripped document text. */
export function DocumentHtmlDiff(props: Props) {
  const { beforeHtml, afterHtml, className } = props;
  const before = stripHtmlToText(beforeHtml);
  const after = stripHtmlToText(afterHtml);
  const { lines, added, removed } = toUnifiedLines(before, after);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center gap-2 text-11 text-tertiary">
        <span className="font-medium text-green-700 dark:text-green-300">+{added}</span>
        <span className="font-medium text-red-700 dark:text-red-300">−{removed}</span>
        <span>سبز (+): اضافه‌شده · قرمز (−): حذف‌شده</span>
      </div>
      <pre
        className="max-h-[420px] overflow-auto rounded-md border border-subtle bg-surface-1 p-0 text-11 leading-5 font-mono"
        dir="auto"
      >
        {lines.map((line, idx) => (
          <div
            key={`${line.kind}-${idx}-${line.text.slice(0, 24)}`}
            className={cn(
              "flex gap-2 px-3 py-0.5 whitespace-pre-wrap break-words",
              line.kind === "added" && "bg-green-500/15 text-green-900 dark:text-green-200",
              line.kind === "removed" && "bg-red-500/15 text-red-900 dark:text-red-200",
              line.kind === "unchanged" && "text-secondary"
            )}
          >
            <span className="w-4 shrink-0 select-none text-center opacity-70">
              {line.kind === "added" ? "+" : line.kind === "removed" ? "−" : " "}
            </span>
            <span className="min-w-0 flex-1">{line.text || " "}</span>
          </div>
        ))}
      </pre>
    </div>
  );
}
