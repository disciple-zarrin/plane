/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { diffArrays, diffWords } from "diff";
import { cn } from "@plane/utils";

type Props = {
  beforeHtml: string;
  afterHtml: string;
  className?: string;
  /** Optional label above the diff (e.g. comparison mode). */
  caption?: string;
};

type BlockDiff = {
  kind: "added" | "removed" | "unchanged" | "changed";
  beforeHtml?: string;
  afterHtml?: string;
};

function stripTags(html: string): string {
  return (html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/** Split document HTML into top-level block snippets (p, h*, li wrappers, divs, …). */
function splitBlocks(html: string): string[] {
  if (typeof document === "undefined") {
    // SSR / tests: crude split on block closers
    return (html || "")
      .split(/(?=<p\b|<h[1-6]\b|<div\b|<ul\b|<ol\b|<blockquote\b|<table\b|<hr\b|<img\b|<image-component\b)/i)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  const wrap = document.createElement("div");
  wrap.innerHTML = html || "";
  const blocks: string[] = [];
  Array.from(wrap.childNodes).forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = (node.textContent || "").trim();
      if (t) blocks.push(`<p>${t}</p>`);
      return;
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      blocks.push(el.outerHTML);
    }
  });
  return blocks.length ? blocks : html ? [html] : [];
}

function buildBlockDiffs(beforeHtml: string, afterHtml: string): { rows: BlockDiff[]; added: number; removed: number } {
  const beforeBlocks = splitBlocks(beforeHtml);
  const afterBlocks = splitBlocks(afterHtml);
  const parts = diffArrays(beforeBlocks, afterBlocks, {
    comparator: (a, b) => stripTags(a) === stripTags(b),
  });

  const rows: BlockDiff[] = [];
  let added = 0;
  let removed = 0;
  let i = 0;

  while (i < parts.length) {
    const part = parts[i];
    const next = parts[i + 1];

    // Pair adjacent remove+add as a single "changed" row (GitLab-style inline edit).
    if (part.removed && next?.added) {
      const removedBlocks = part.value;
      const addedBlocks = next.value;
      const n = Math.max(removedBlocks.length, addedBlocks.length);
      for (let k = 0; k < n; k += 1) {
        const b = removedBlocks[k];
        const a = addedBlocks[k];
        if (b != null && a != null) {
          rows.push({ kind: "changed", beforeHtml: b, afterHtml: a });
          added += 1;
          removed += 1;
        } else if (a != null) {
          rows.push({ kind: "added", afterHtml: a });
          added += 1;
        } else if (b != null) {
          rows.push({ kind: "removed", beforeHtml: b });
          removed += 1;
        }
      }
      i += 2;
      continue;
    }

    if (part.added) {
      part.value.forEach((html) => {
        rows.push({ kind: "added", afterHtml: html });
        added += 1;
      });
    } else if (part.removed) {
      part.value.forEach((html) => {
        rows.push({ kind: "removed", beforeHtml: html });
        removed += 1;
      });
    } else {
      part.value.forEach((html) => {
        rows.push({ kind: "unchanged", afterHtml: html });
      });
    }
    i += 1;
  }

  return { rows, added, removed };
}

function WordDiffLine({ before, after, mode }: { before: string; after: string; mode: "old" | "new" }) {
  const parts = diffWords(before, after);
  return (
    <>
      {parts.map((part, idx) => {
        if (mode === "old" && part.added) return null;
        if (mode === "new" && part.removed) return null;
        return (
          <span
            key={`${mode}-${idx}-${part.value.slice(0, 12)}`}
            className={cn(
              mode === "old" && part.removed && "rounded-sm bg-red-500/30 text-red-950 dark:text-red-100",
              mode === "new" && part.added && "rounded-sm bg-green-500/30 text-green-950 dark:text-green-100"
            )}
          >
            {part.value}
          </span>
        );
      })}
    </>
  );
}

function BlockBody({ html, className }: { html: string; className?: string }) {
  return (
    <div
      className={cn(
        "min-w-0 flex-1 text-14 leading-6 text-primary [&_h1]:text-20 [&_h1]:font-semibold [&_h2]:text-18 [&_h2]:font-semibold [&_h3]:text-16 [&_h3]:font-medium [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1",
        className
      )}
      // Page HTML is first-party editor content (same trust as version preview).
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** GitLab-style document diff: document typography + green/red gutters (++/−−). */
export function DocumentHtmlDiff(props: Props) {
  const { beforeHtml, afterHtml, className, caption } = props;
  const { rows, added, removed } = buildBlockDiffs(beforeHtml, afterHtml);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-3 text-12">
        <span className="rounded-sm bg-green-500/15 px-1.5 py-0.5 font-medium text-green-800 dark:text-green-200">
          ++{added}
        </span>
        <span className="rounded-sm bg-red-500/15 px-1.5 py-0.5 font-medium text-red-800 dark:text-red-200">
          −−{removed}
        </span>
        {caption && <span className="text-tertiary">{caption}</span>}
      </div>

      <div className="overflow-hidden rounded-md border border-subtle bg-surface-1">
        {rows.length === 0 && <p className="px-4 py-6 text-13 text-tertiary">تغییری نیست.</p>}
        {rows.map((row, idx) => {
          if (row.kind === "changed" && row.beforeHtml && row.afterHtml) {
            const beforeText = stripTags(row.beforeHtml);
            const afterText = stripTags(row.afterHtml);
            return (
              <div key={`c-${idx}`} className="border-b border-subtle last:border-b-0">
                <div className="flex gap-0 bg-red-500/10">
                  <span className="w-8 shrink-0 select-none py-2 text-center font-mono text-12 font-semibold text-red-700 dark:text-red-300">
                    −−
                  </span>
                  <div className="min-w-0 flex-1 py-2 pe-3 text-14 leading-6 text-primary" dir="auto">
                    <WordDiffLine before={beforeText} after={afterText} mode="old" />
                  </div>
                </div>
                <div className="flex gap-0 bg-green-500/10">
                  <span className="w-8 shrink-0 select-none py-2 text-center font-mono text-12 font-semibold text-green-700 dark:text-green-300">
                    ++
                  </span>
                  <div className="min-w-0 flex-1 py-2 pe-3 text-14 leading-6 text-primary" dir="auto">
                    <WordDiffLine before={beforeText} after={afterText} mode="new" />
                  </div>
                </div>
              </div>
            );
          }

          const html = row.afterHtml || row.beforeHtml || "";
          const mark = row.kind === "added" ? "++" : row.kind === "removed" ? "−−" : " ";
          return (
            <div
              key={`${row.kind}-${idx}`}
              className={cn(
                "flex gap-0 border-b border-subtle last:border-b-0",
                row.kind === "added" && "bg-green-500/10",
                row.kind === "removed" && "bg-red-500/10"
              )}
            >
              <span
                className={cn(
                  "w-8 shrink-0 select-none py-2 text-center font-mono text-12 font-semibold",
                  row.kind === "added" && "text-green-700 dark:text-green-300",
                  row.kind === "removed" && "text-red-700 dark:text-red-300",
                  row.kind === "unchanged" && "text-tertiary"
                )}
              >
                {mark}
              </span>
              <div className="min-w-0 flex-1 py-2 pe-3" dir="auto">
                <BlockBody html={html} className={row.kind === "removed" ? "opacity-80" : undefined} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
