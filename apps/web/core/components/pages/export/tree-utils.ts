/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TExportTree, TExportTreePage } from "@/services/page/page-export.service";

export type TExportLocale = "fa" | "en";

const LABELS = {
  fa: {
    toc: "فهرست مطالب",
    page: "صفحه",
    untitled: "بدون عنوان",
    link: "لینک",
  },
  en: {
    toc: "Table of Contents",
    page: "Page",
    untitled: "Untitled",
    link: "Link",
  },
} as const;

/** FA if any Arabic/Persian letters exist; otherwise EN. Mixed docs use FA+Vazirmatn (covers Latin). */
export function detectExportLocale(...chunks: Array<string | null | undefined>): TExportLocale {
  const text = chunks.filter(Boolean).join("\n");
  return /[\u0600-\u06FF]/.test(text) ? "fa" : "en";
}

export function exportLabels(locale: TExportLocale) {
  return LABELS[locale];
}

export function detectLocaleFromTree(tree: TExportTree): TExportLocale {
  return detectExportLocale(
    ...tree.pages.map((p) => `${p.name || ""}\n${p.description_html || ""}`)
  );
}

/** Rewrite page mentions to internal anchors for export documents. */
export function rewritePageMentionsToBookmarks(
  html: string,
  pages: TExportTreePage[],
  locale?: TExportLocale
): string {
  const labels = exportLabels(locale ?? detectExportLocale(html, ...pages.map((p) => p.name)));
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

export function buildCombinedHtml(tree: TExportTree, options?: { includeToc?: boolean; locale?: TExportLocale }): string {
  const ordered = flattenExportTree(tree);
  const locale = options?.locale ?? detectLocaleFromTree(tree);
  const labels = exportLabels(locale);
  const parts: string[] = [];
  if (options?.includeToc !== false) {
    parts.push(`<h1 class="page-title">${labels.toc}</h1><ul class="toc">`);
    ordered.forEach((p, idx) => {
      const depth = getDepth(p, tree);
      parts.push(
        `<li style="margin-inline-start:${depth * 12}px"><a href="#${p.bookmark_id}">${idx + 1}. ${escapeHtml(p.name || labels.untitled)}</a></li>`
      );
    });
    parts.push(`</ul><div data-type="horizontalRule"></div>`);
  }
  ordered.forEach((p) => {
    const body = rewritePageMentionsToBookmarks(p.description_html || "<p></p>", tree.pages, locale);
    parts.push(
      `<div id="${p.bookmark_id}"><h1 class="page-title">${escapeHtml(p.name || labels.untitled)}</h1>${body}</div>`
    );
  });
  return sanitizeHtmlForPdf(parts.join("\n"));
}

/** Normalize editor HTML so react-pdf-html can render EN/FA content reliably. */
export function sanitizeHtmlForPdf(html: string): string {
  let out = html || "<p></p>";
  out = out
    .replace(/<\/?section\b[^>]*>/gi, (tag) => (tag.startsWith("</") ? "</div>" : tag.replace(/^<section/i, "<div")))
    .replace(/<hr\s*\/?>/gi, '<div data-type="horizontalRule"></div>')
    .replace(/<\/?(colgroup|col|thead|tbody|tfoot)\b[^>]*>/gi, "")
    .replace(/<th\b([^>]*)>/gi, "<td$1>")
    .replace(/<\/th>/gi, "</td>")
    // drop editor chrome / null colors that confuse the PDF HTML parser
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
export function injectLiveRootHtml(tree: TExportTree, html: string | undefined | null, name?: string): TExportTree {
  if (!html && !name) return tree;
  return {
    ...tree,
    pages: tree.pages.map((p) =>
      p.id === tree.root
        ? {
            ...p,
            description_html: html ?? p.description_html,
            name: name?.trim() ? name : p.name,
          }
        : p
    ),
  };
}
