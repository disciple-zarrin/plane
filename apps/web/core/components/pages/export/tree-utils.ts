/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TExportTree, TExportTreePage } from "@/services/page/page-export.service";

export type TExportLabels = {
  toc: string;
  page: string;
  untitled: string;
  link: string;
};

/** True if HTML contains any explicit RTL block. */
export function htmlHasRtl(html: string | undefined | null): boolean {
  return /dir=["']rtl["']/i.test(html || "");
}

/**
 * Ensure block-level `dir` also has inline direction/text-align styles.
 * react-pdf-html often ignores the HTML `dir` attribute unless direction is in style.
 */
export function applyInlineDirectionStyles(html: string): string {
  return (html || "").replace(
    /<(p|h[1-6]|li|blockquote|div|td|th)(\s[^>]*)?>/gi,
    (full, tag: string, rawAttrs?: string) => {
      const attrs = rawAttrs || "";
      const dirMatch = attrs.match(/\bdir=["'](rtl|ltr)["']/i);
      if (!dirMatch) return full;
      const dir = dirMatch[1].toLowerCase();
      const align = dir === "rtl" ? "right" : "left";
      if (/\bstyle=["'][^"']*["']/i.test(attrs)) {
        const nextAttrs = attrs.replace(/\bstyle=["']([^"']*)["']/i, (_s, style: string) => {
          let next = style.trim().replace(/;?\s*$/, "");
          if (!/direction\s*:/i.test(next)) next = `${next};direction:${dir}`;
          if (!/text-align\s*:/i.test(next)) next = `${next};text-align:${align}`;
          return `style="${next}"`;
        });
        return `<${tag}${nextAttrs}>`;
      }
      return `<${tag}${attrs} style="direction:${dir};text-align:${align}">`;
    }
  );
}

/** Read dir from an opening tag's attribute string. Falls back when unset. */
export function directionFromAttrs(attrs: string | undefined | null, fallbackRtl = false): boolean {
  const match = (attrs || "").match(/\bdir=["'](rtl|ltr)["']/i);
  if (!match) return fallbackRtl;
  return match[1].toLowerCase() === "rtl";
}

/** Labels follow document direction (RTL toggle), not UI/language locale. */
export function exportLabels(isRtl: boolean): TExportLabels {
  return isRtl
    ? { toc: "فهرست مطالب", page: "صفحه", untitled: "بدون عنوان", link: "لینک" }
    : { toc: "Table of Contents", page: "Page", untitled: "Untitled", link: "Link" };
}

export function pageIsRtl(page: Pick<TExportTreePage, "is_rtl" | "description_html"> | undefined | null): boolean {
  if (!page) return false;
  // Prefer explicit paragraph dirs in content over the legacy page-level flag.
  if (htmlHasRtl(page.description_html)) return true;
  return Boolean(page.is_rtl);
}

/** Majority RTL among tree pages (for TOC / shared chrome). */
export function treeIsRtl(tree: TExportTree): boolean {
  const pages = tree.pages || [];
  if (!pages.length) return false;
  const rtlCount = pages.filter((p) => pageIsRtl(p)).length;
  return rtlCount * 2 >= pages.length;
}

/** Rewrite page mentions to internal anchors for export documents. */
export function rewritePageMentionsToBookmarks(html: string, pages: TExportTreePage[], isRtl?: boolean): string {
  const labels = exportLabels(isRtl ?? treeIsRtl({ root: pages[0]?.id || "", pages }));
  const byId = new Map(pages.map((p) => [p.id, p]));
  return html.replace(/<mention-component([^>]*?)>/gi, (full, attrs: string) => {
    const idMatch = attrs.match(/entity_identifier=["']([^"']+)["']/i) || attrs.match(/\bid=["']([^"']+)["']/i);
    const entityMatch = attrs.match(/entity_name=["']([^"']+)["']/i);
    const entity = entityMatch?.[1] || "";
    const id = idMatch?.[1];
    if (!id || (entity && entity !== "page" && entity !== "page_mention")) {
      return full;
    }
    const page = byId.get(id);
    if (!page) {
      return `<span class="page-link-external">${id}</span>`;
    }
    return `<a href="#${page.bookmark_id}" class="page-link-internal">${escapeHtml(page.name || labels.page)}</a>`;
  });
}

/** Depth-first ordered list of pages starting at root. */
export function flattenExportTree(tree: TExportTree): TExportTreePage[] {
  const byId = new Map(tree.pages.map((p) => [p.id, p]));
  const ordered: TExportTreePage[] = [];
  const walk = (id: string) => {
    const page = byId.get(id);
    if (!page || ordered.find((p) => p.id === id)) return;
    ordered.push(page);
    (page.children_ids || []).forEach(walk);
  };
  walk(tree.root);
  tree.pages.forEach((p) => {
    if (!ordered.find((x) => x.id === p.id)) ordered.push(p);
  });
  return ordered;
}

export function buildCombinedHtml(tree: TExportTree, options?: { includeToc?: boolean }): string {
  const ordered = flattenExportTree(tree);
  const rtlDoc = treeIsRtl(tree);
  const labels = exportLabels(rtlDoc);
  const parts: string[] = [];
  if (options?.includeToc !== false) {
    parts.push(
      `<div dir="${rtlDoc ? "rtl" : "ltr"}" style="direction:${rtlDoc ? "rtl" : "ltr"};text-align:${rtlDoc ? "right" : "left"}"><h1 class="page-title">${labels.toc}</h1><ul class="toc">`
    );
    ordered.forEach((p, idx) => {
      const depth = getDepth(p, tree);
      parts.push(
        `<li style="margin-inline-start:${depth * 12}px"><a href="#${p.bookmark_id}">${idx + 1}. ${escapeHtml(p.name || labels.untitled)}</a></li>`
      );
    });
    parts.push(`</ul><div data-type="horizontalRule"></div></div>`);
  }
  ordered.forEach((p) => {
    const rtl = pageIsRtl(p);
    const body = applyInlineDirectionStyles(
      rewritePageMentionsToBookmarks(p.description_html || "<p></p>", tree.pages, rtl)
    );
    // Title uses page-level default; body paragraphs keep their own dir attrs/styles.
    parts.push(
      `<div id="${p.bookmark_id}"><h1 class="page-title" dir="${rtl ? "rtl" : "ltr"}" style="direction:${rtl ? "rtl" : "ltr"};text-align:${rtl ? "right" : "left"}">${escapeHtml(p.name || labels.untitled)}</h1>${body}</div>`
    );
  });
  return sanitizeHtmlForPdf(parts.join("\n"));
}

/** Normalize editor HTML so react-pdf-html can render content reliably. */
export function sanitizeHtmlForPdf(html: string): string {
  let out = applyInlineDirectionStyles(html || "<p></p>");
  out = out
    .replace(/<\/?section\b[^>]*>/gi, (tag) => (tag.startsWith("</") ? "</div>" : tag.replace(/^<section/i, "<div")))
    .replace(/<hr\s*\/?>/gi, '<div data-type="horizontalRule"></div>')
    .replace(/<\/?(colgroup|col|thead|tbody|tfoot)\b[^>]*>/gi, "")
    .replace(/<th\b([^>]*)>/gi, "<td$1>")
    .replace(/<\/th>/gi, "</td>")
    .replace(/\sstyle="[^"]*background-color:\s*null[^"]*"/gi, "")
    .replace(/\sstyle="[^"]*color:\s*null[^"]*"/gi, "")
    .replace(/\u00a0/g, " ");
  return out;
}

function getDepth(page: TExportTreePage, tree: TExportTree): number {
  let d = 0;
  let cur: string | null = page.parent;
  const byId = new Map(tree.pages.map((p) => [p.id, p]));
  while (cur && byId.has(cur) && d < 20) {
    d += 1;
    cur = byId.get(cur)?.parent ?? null;
  }
  return d;
}

export function escapeHtml(s: string): string {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function stripHtmlToText(html: string): string {
  return (html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Patch live editor HTML into the tree root (keeps unsaved edits in exports). */
export function injectLiveRootHtml(
  tree: TExportTree,
  html: string | undefined | null,
  name?: string,
  isRtl?: boolean
): TExportTree {
  if (html == null && !name && isRtl === undefined) return tree;
  return {
    ...tree,
    pages: tree.pages.map((p) =>
      p.id === tree.root
        ? {
            ...p,
            description_html: html ?? p.description_html,
            name: name?.trim() ? name : p.name,
            is_rtl: isRtl !== undefined ? isRtl : p.is_rtl,
          }
        : p
    ),
  };
}
