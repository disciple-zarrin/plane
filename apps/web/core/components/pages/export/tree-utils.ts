/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TExportTree, TExportTreePage } from "@/services/page/page-export.service";

/** Rewrite page mentions to internal anchors for export documents. */
export function rewritePageMentionsToBookmarks(html: string, pages: TExportTreePage[]): string {
  const byId = new Map(pages.map((p) => [p.id, p]));
  return html.replace(
    /<mention-component([^>]*?)>/gi,
    (full, attrs: string) => {
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
      return `<a href="#${page.bookmark_id}" class="page-link-internal">${page.name || "صفحه"}</a>`;
    }
  );
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
  // orphans (safety)
  tree.pages.forEach((p) => {
    if (!ordered.find((x) => x.id === p.id)) ordered.push(p);
  });
  return ordered;
}

export function buildCombinedHtml(tree: TExportTree, options?: { includeToc?: boolean }): string {
  const ordered = flattenExportTree(tree);
  const parts: string[] = [];
  if (options?.includeToc !== false) {
    parts.push(`<h1 class="page-title">فهرست مطالب</h1><ul class="toc">`);
    ordered.forEach((p, idx) => {
      const depth = getDepth(p, tree);
      parts.push(
        `<li style="margin-inline-start:${depth * 12}px"><a href="#${p.bookmark_id}">${idx + 1}. ${escapeHtml(p.name)}</a></li>`
      );
    });
    parts.push(`</ul><div data-type="horizontalRule"></div>`);
  }
  ordered.forEach((p) => {
    const body = rewritePageMentionsToBookmarks(p.description_html || "<p></p>", tree.pages);
    // Use div (not section/hr) — react-pdf-html drops unsupported tags and can wipe the page body.
    parts.push(
      `<div id="${p.bookmark_id}"><h1 class="page-title">${escapeHtml(p.name)}</h1>${body}</div>`
    );
  });
  return sanitizeHtmlForPdf(parts.join("\n"));
}

/** Normalize editor HTML so react-pdf-html can render it reliably. */
export function sanitizeHtmlForPdf(html: string): string {
  return (html || "<p></p>")
    .replace(/<\/?section\b[^>]*>/gi, (tag) => (tag.startsWith("</") ? "</div>" : tag.replace(/^<section/i, "<div")))
    .replace(/<hr\s*\/?>/gi, '<div data-type="horizontalRule"></div>')
    .replace(/\u00a0/g, " ");
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
