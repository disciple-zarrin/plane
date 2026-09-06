/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useState, Fragment } from "react";
import { diffArrays, diffWords } from "diff";
import { ChevronDown, ChevronRight, FileText } from "lucide-react";
import { cn } from "@plane/utils";

type Props = {
  beforeHtml: string;
  afterHtml: string;
  className?: string;
  caption?: string;
  fileName?: string;
};

type DiffRow = {
  kind: "added" | "removed" | "unchanged" | "changed";
  beforeText?: string;
  afterText?: string;
  oldNo?: number | null;
  newNo?: number | null;
};

const CONTEXT = 3;

function stripTags(html: string): string {
  return (html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|h[1-6]|li|tr|div|blockquote)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function toLines(html: string): string[] {
  const text = stripTags(html);
  if (!text) return [];
  return text.split("\n");
}

function buildRows(beforeHtml: string, afterHtml: string): { rows: DiffRow[]; added: number; removed: number } {
  const beforeLines = toLines(beforeHtml);
  const afterLines = toLines(afterHtml);
  const parts = diffArrays(beforeLines, afterLines);

  const rows: DiffRow[] = [];
  let added = 0;
  let removed = 0;
  let oldNo = 0;
  let newNo = 0;
  let i = 0;

  while (i < parts.length) {
    const part = parts[i];
    const next = parts[i + 1];

    if (part.removed && next?.added) {
      const left = part.value;
      const right = next.value;
      const n = Math.max(left.length, right.length);
      for (let k = 0; k < n; k += 1) {
        const b = left[k];
        const a = right[k];
        if (b != null && a != null) {
          oldNo += 1;
          newNo += 1;
          rows.push({ kind: "changed", beforeText: b, afterText: a, oldNo, newNo });
          added += 1;
          removed += 1;
        } else if (a != null) {
          newNo += 1;
          rows.push({ kind: "added", afterText: a, oldNo: null, newNo });
          added += 1;
        } else if (b != null) {
          oldNo += 1;
          rows.push({ kind: "removed", beforeText: b, oldNo, newNo: null });
          removed += 1;
        }
      }
      i += 2;
      continue;
    }

    if (part.added) {
      part.value.forEach((line) => {
        newNo += 1;
        rows.push({ kind: "added", afterText: line, oldNo: null, newNo });
        added += 1;
      });
    } else if (part.removed) {
      part.value.forEach((line) => {
        oldNo += 1;
        rows.push({ kind: "removed", beforeText: line, oldNo, newNo: null });
        removed += 1;
      });
    } else {
      part.value.forEach((line) => {
        oldNo += 1;
        newNo += 1;
        rows.push({ kind: "unchanged", afterText: line, oldNo, newNo });
      });
    }
    i += 1;
  }

  return { rows, added, removed };
}

type Segment = { type: "rows"; rows: DiffRow[] } | { type: "collapse"; count: number; rows: DiffRow[]; id: string };

function segmentRows(rows: DiffRow[]): Segment[] {
  const out: Segment[] = [];
  let i = 0;
  let collapseId = 0;
  while (i < rows.length) {
    if (rows[i].kind !== "unchanged") {
      const chunk: DiffRow[] = [];
      while (i < rows.length && rows[i].kind !== "unchanged") {
        chunk.push(rows[i]);
        i += 1;
      }
      out.push({ type: "rows", rows: chunk });
      continue;
    }
    let j = i;
    while (j < rows.length && rows[j].kind === "unchanged") j += 1;
    const run = rows.slice(i, j);
    if (run.length <= CONTEXT * 2 + 1) {
      out.push({ type: "rows", rows: run });
    } else {
      out.push({ type: "rows", rows: run.slice(0, CONTEXT) });
      out.push({
        type: "collapse",
        count: run.length - CONTEXT * 2,
        rows: run.slice(CONTEXT, -CONTEXT),
        id: `c-${collapseId++}`,
      });
      out.push({ type: "rows", rows: run.slice(-CONTEXT) });
    }
    i = j;
  }
  return out;
}

function WordInline({ before, after, mode }: { before: string; after: string; mode: "old" | "new" }) {
  const parts = diffWords(before || "", after || "");
  return (
    <span className="break-words whitespace-pre-wrap">
      {parts.map((part, idx) => {
        if (mode === "old" && part.added) return null;
        if (mode === "new" && part.removed) return null;
        const highlight = (mode === "old" && part.removed) || (mode === "new" && part.added);
        return (
          <span
            key={`${mode}-${idx}`}
            className={cn(
              highlight && mode === "old" && "rounded-[2px] bg-[#ff818266] text-inherit dark:bg-[#f8514966]",
              highlight && mode === "new" && "rounded-[2px] bg-[#abf2bc] text-inherit dark:bg-[#2ea04366]"
            )}
          >
            {part.value || " "}
          </span>
        );
      })}
    </span>
  );
}

function LineGutter({
  oldNo,
  newNo,
  mark,
  kind,
}: {
  oldNo?: number | null;
  newNo?: number | null;
  mark: string;
  kind: DiffRow["kind"];
}) {
  return (
    <>
      <td
        className={cn(
          "font-mono w-12 border-e border-[#d0d7de] px-2 py-0 text-end text-[12px] leading-6 text-[#656d76] select-none dark:border-[#30363d] dark:text-[#8b949e]",
          kind === "removed" && "bg-[#fff5f5] dark:bg-[#490202]/50",
          kind === "added" && "bg-[#f0fff4] dark:bg-[#04260f]/50",
          kind === "changed" && mark === "−" && "bg-[#fff5f5] dark:bg-[#490202]/50",
          kind === "changed" && mark === "+" && "bg-[#f0fff4] dark:bg-[#04260f]/50"
        )}
      >
        {oldNo ?? ""}
      </td>
      <td
        className={cn(
          "font-mono w-12 border-e border-[#d0d7de] px-2 py-0 text-end text-[12px] leading-6 text-[#656d76] select-none dark:border-[#30363d] dark:text-[#8b949e]",
          kind === "removed" && "bg-[#fff5f5] dark:bg-[#490202]/50",
          kind === "added" && "bg-[#f0fff4] dark:bg-[#04260f]/50",
          kind === "changed" && mark === "−" && "bg-[#fff5f5] dark:bg-[#490202]/50",
          kind === "changed" && mark === "+" && "bg-[#f0fff4] dark:bg-[#04260f]/50"
        )}
      >
        {newNo ?? ""}
      </td>
      <td
        className={cn(
          "font-mono w-6 border-e border-[#d0d7de] px-1 py-0 text-center text-[12px] leading-6 select-none dark:border-[#30363d]",
          mark === "+" && "bg-[#dafbe1] font-semibold text-[#1a7f37] dark:bg-[#2ea043]/30 dark:text-[#3fb950]",
          mark === "−" && "bg-[#ffebe9] font-semibold text-[#cf222e] dark:bg-[#f85149]/30 dark:text-[#ff7b72]",
          !mark.trim() && "bg-[#f6f8fa] text-[#656d76] dark:bg-[#161b22] dark:text-[#8b949e]",
          kind === "removed" && mark === "−" && "bg-[#ffebe9] dark:bg-[#f85149]/30",
          kind === "added" && mark === "+" && "bg-[#dafbe1] dark:bg-[#2ea043]/30"
        )}
      >
        {mark}
      </td>
    </>
  );
}

function DiffLineRow({
  kind,
  mark,
  oldNo,
  newNo,
  children,
}: {
  kind: DiffRow["kind"];
  mark: string;
  oldNo?: number | null;
  newNo?: number | null;
  children: React.ReactNode;
}) {
  return (
    <tr
      className={cn(
        kind === "added" && "bg-[#f0fff4] dark:bg-[#04260f]/40",
        kind === "removed" && "bg-[#fff5f5] dark:bg-[#490202]/40",
        kind === "unchanged" && "bg-white dark:bg-[#0d1117]",
        kind === "changed" && mark === "+" && "bg-[#f0fff4] dark:bg-[#04260f]/40",
        kind === "changed" && mark === "−" && "bg-[#fff5f5] dark:bg-[#490202]/40"
      )}
    >
      <LineGutter oldNo={oldNo} newNo={newNo} mark={mark} kind={kind} />
      <td className="px-3 py-0 text-[13px] leading-6 text-[#1f2328] dark:text-[#e6edf3]" dir="auto">
        {children}
      </td>
    </tr>
  );
}

function SideBySide({ rows }: { rows: DiffRow[] }) {
  return (
    <div className="grid grid-cols-2 divide-x divide-[#d0d7de] dark:divide-[#30363d]">
      <table className="w-full border-collapse">
        <tbody>
          {rows.map((row, idx) => {
            if (row.kind === "added") {
              return (
                <tr key={`l-${idx}`} className="bg-[#f6f8fa] dark:bg-[#161b22]">
                  <td className="font-mono w-10 px-2 py-0 text-end text-[12px] text-[#656d76]"> </td>
                  <td className="px-3 py-0 text-[13px] leading-6 text-transparent">.</td>
                </tr>
              );
            }
            const text = row.beforeText ?? row.afterText ?? "";
            const isDel = row.kind === "removed" || row.kind === "changed";
            return (
              <tr
                key={`l-${idx}`}
                className={cn(isDel ? "bg-[#fff5f5] dark:bg-[#490202]/40" : "bg-white dark:bg-[#0d1117]")}
              >
                <td className="font-mono w-10 px-2 py-0 text-end text-[12px] text-[#656d76] select-none">
                  {row.oldNo ?? ""}
                </td>
                <td className="px-3 py-0 text-[13px] leading-6" dir="auto">
                  {row.kind === "changed" ? (
                    <WordInline before={row.beforeText || ""} after={row.afterText || ""} mode="old" />
                  ) : (
                    <span className="break-words whitespace-pre-wrap">{text || " "}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <table className="w-full border-collapse">
        <tbody>
          {rows.map((row, idx) => {
            if (row.kind === "removed") {
              return (
                <tr key={`r-${idx}`} className="bg-[#f6f8fa] dark:bg-[#161b22]">
                  <td className="font-mono w-10 px-2 py-0 text-end text-[12px] text-[#656d76]"> </td>
                  <td className="px-3 py-0 text-[13px] leading-6 text-transparent">.</td>
                </tr>
              );
            }
            const text = row.afterText ?? row.beforeText ?? "";
            const isAdd = row.kind === "added" || row.kind === "changed";
            return (
              <tr
                key={`r-${idx}`}
                className={cn(isAdd ? "bg-[#f0fff4] dark:bg-[#04260f]/40" : "bg-white dark:bg-[#0d1117]")}
              >
                <td className="font-mono w-10 px-2 py-0 text-end text-[12px] text-[#656d76] select-none">
                  {row.newNo ?? ""}
                </td>
                <td className="px-3 py-0 text-[13px] leading-6" dir="auto">
                  {row.kind === "changed" ? (
                    <WordInline before={row.beforeText || ""} after={row.afterText || ""} mode="new" />
                  ) : (
                    <span className="break-words whitespace-pre-wrap">{text || " "}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** GitLab-like document version diff (unified / side-by-side). */
export function DocumentHtmlDiff(props: Props) {
  const { beforeHtml, afterHtml, className, caption, fileName = "document.md" } = props;
  const { rows, added, removed } = useMemo(() => buildRows(beforeHtml, afterHtml), [beforeHtml, afterHtml]);
  const segments = useMemo(() => segmentRows(rows), [rows]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [view, setView] = useState<"unified" | "split">("unified");
  const [collapsed, setCollapsed] = useState(false);

  const visibleRows = useMemo(() => {
    const out: DiffRow[] = [];
    segments.forEach((seg) => {
      if (seg.type === "rows") out.push(...seg.rows);
      else if (expanded[seg.id]) out.push(...seg.rows);
    });
    return out;
  }, [segments, expanded]);

  return (
    <div className={cn("space-y-3", className)}>
      {caption && <p className="text-[12px] text-[#656d76] dark:text-[#8b949e]">{caption}</p>}

      <div className="shadow-sm overflow-hidden rounded-lg border border-[#d0d7de] bg-white dark:border-[#30363d] dark:bg-[#0d1117]">
        {/* GitLab-style file header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d0d7de] bg-[#f6f8fa] px-3 py-2 dark:border-[#30363d] dark:bg-[#161b22]">
          <button
            type="button"
            className="flex min-w-0 items-center gap-2 text-start"
            onClick={() => setCollapsed((v) => !v)}
          >
            {collapsed ? (
              <ChevronRight className="size-4 shrink-0 text-[#656d76]" />
            ) : (
              <ChevronDown className="size-4 shrink-0 text-[#656d76]" />
            )}
            <FileText className="size-4 shrink-0 text-[#656d76]" />
            <span className="font-mono truncate text-[13px] font-semibold text-[#1f2328] dark:text-[#e6edf3]">
              {fileName}
            </span>
            <span className="font-mono ms-1 text-[12px] text-[#1a7f37] dark:text-[#3fb950]">+{added}</span>
            <span className="font-mono text-[12px] text-[#cf222e] dark:text-[#ff7b72]">−{removed}</span>
          </button>

          <div className="flex items-center gap-1 rounded-md border border-[#d0d7de] bg-white p-0.5 text-[12px] dark:border-[#30363d] dark:bg-[#0d1117]">
            <button
              type="button"
              className={cn(
                "rounded px-2 py-0.5",
                view === "unified"
                  ? "bg-[#0969da] text-white"
                  : "text-[#656d76] hover:bg-[#f6f8fa] dark:text-[#8b949e] dark:hover:bg-[#161b22]"
              )}
              onClick={() => setView("unified")}
            >
              Inline
            </button>
            <button
              type="button"
              className={cn(
                "rounded px-2 py-0.5",
                view === "split"
                  ? "bg-[#0969da] text-white"
                  : "text-[#656d76] hover:bg-[#f6f8fa] dark:text-[#8b949e] dark:hover:bg-[#161b22]"
              )}
              onClick={() => setView("split")}
            >
              Side-by-side
            </button>
          </div>
        </div>

        {!collapsed && rows.length === 0 && (
          <p className="px-4 py-8 text-center text-[13px] text-[#656d76]">No changes to show</p>
        )}

        {!collapsed && rows.length > 0 && view === "split" && (
          <SideBySide rows={visibleRows.length ? visibleRows : rows} />
        )}

        {!collapsed && rows.length > 0 && view === "unified" && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse">
              <tbody>
                {segments.map((seg, sIdx) => {
                  if (seg.type === "collapse") {
                    if (expanded[seg.id]) {
                      return seg.rows.map((row, idx) => (
                        <DiffLineRow
                          key={`${seg.id}-${idx}`}
                          kind="unchanged"
                          mark=" "
                          oldNo={row.oldNo}
                          newNo={row.newNo}
                        >
                          <span className="break-words whitespace-pre-wrap">{row.afterText || " "}</span>
                        </DiffLineRow>
                      ));
                    }
                    return (
                      <tr key={seg.id} className="bg-[#f6f8fa] dark:bg-[#161b22]">
                        <td colSpan={4} className="border-y border-[#d0d7de] py-0 dark:border-[#30363d]">
                          <button
                            type="button"
                            className="font-mono flex w-full items-center justify-center gap-2 py-1.5 text-[12px] text-[#0969da] hover:bg-[#ddf4ff] dark:hover:bg-[#0c2d6b]/40"
                            onClick={() => setExpanded((e) => ({ ...e, [seg.id]: true }))}
                          >
                            ⋮ Expand {seg.count} unchanged lines
                          </button>
                        </td>
                      </tr>
                    );
                  }

                  return seg.rows.map((row, idx) => {
                    const key = `${sIdx}-${idx}-${row.kind}`;
                    if (row.kind === "changed") {
                      return (
                        <Fragment key={key}>
                          <DiffLineRow kind="changed" mark="−" oldNo={row.oldNo} newNo={null}>
                            <WordInline before={row.beforeText || ""} after={row.afterText || ""} mode="old" />
                          </DiffLineRow>
                          <DiffLineRow kind="changed" mark="+" oldNo={null} newNo={row.newNo}>
                            <WordInline before={row.beforeText || ""} after={row.afterText || ""} mode="new" />
                          </DiffLineRow>
                        </Fragment>
                      );
                    }
                    if (row.kind === "added") {
                      return (
                        <DiffLineRow key={key} kind="added" mark="+" oldNo={null} newNo={row.newNo}>
                          <span className="break-words whitespace-pre-wrap">{row.afterText || " "}</span>
                        </DiffLineRow>
                      );
                    }
                    if (row.kind === "removed") {
                      return (
                        <DiffLineRow key={key} kind="removed" mark="−" oldNo={row.oldNo} newNo={null}>
                          <span className="break-words whitespace-pre-wrap">{row.beforeText || " "}</span>
                        </DiffLineRow>
                      );
                    }
                    return (
                      <DiffLineRow key={key} kind="unchanged" mark=" " oldNo={row.oldNo} newNo={row.newNo}>
                        <span className="break-words whitespace-pre-wrap">{row.afterText || " "}</span>
                      </DiffLineRow>
                    );
                  });
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
