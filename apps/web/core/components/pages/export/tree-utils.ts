/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TExportTree, TExportTreePage } from "@/services/page/page-export.service";
import { getCachedPageMentionName } from "@/components/editor/embeds/mentions/page-cache";

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

/** True if text contains Arabic/Persian script (for per-line direction). */
export function textLooksRtl(text: string | undefined | null): boolean {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text || "");
}

/**
 * Page title direction: follow title script when present.
 * Empty / untitled titles inherit body RTL so FA pages are not forced LTR.
 */
export function pageTitleLooksRtl(title: string | undefined | null, bodyHtml?: string | undefined | null): boolean {
  const t = (title || "").trim();
  if (textLooksRtl(t)) return true;
  if (!t || !/[A-Za-z\u00C0-\u024F\u0600-\u06FF]/.test(t)) {
    return htmlHasRtl(bodyHtml);
  }
  return false;
}

/** Labels follow document direction (RTL toggle), not UI/language locale. */
export function exportLabels(isRtl: boolean): TExportLabels {
  return isRtl
    ? { toc: "فهرست مطالب", page: "صفحه", untitled: "بدون عنوان", link: "لینک" }
    : { toc: "Table of Contents", page: "Page", untitled: "Untitled", link: "Link" };
}

export function pageIsRtl(
  page: Pick<TExportTreePage, "is_rtl" | "description_html" | "name"> | undefined | null
): boolean {
  if (!page) return false;
  // Title script, then body dirs, then legacy page flag.
  if (textLooksRtl(page.name)) return true;
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
export function rewritePageMentionsToBookmarks(
  html: string,
  pages: TExportTreePage[],
  isRtl?: boolean,
  options?: { webBaseUrl?: string }
): string {
  const labels = exportLabels(isRtl ?? treeIsRtl({ root: pages[0]?.id || "", pages }));
  const byId = new Map(pages.map((p) => [p.id, p]));
  const webBase = (options?.webBaseUrl || "").replace(/\/$/, "");

  if (typeof DOMParser !== "undefined") {
    try {
      const doc = new DOMParser().parseFromString(`<div id="__export_root">${html || ""}</div>`, "text/html");
      const root = doc.getElementById("__export_root");
      if (root) {
        root.querySelectorAll("mention-component").forEach((component) => {
          const id = component.getAttribute("entity_identifier") || component.getAttribute("id") || "";
          const entity = component.getAttribute("entity_name") || "";
          if (!id || (entity && entity !== "page" && entity !== "page_mention")) {
            component.replaceWith(doc.createTextNode(component.textContent || ""));
            return;
          }
          const page = byId.get(id);
          const title = page?.name || getCachedPageMentionName(id) || labels.page;
          if (page) {
            const a = doc.createElement("a");
            a.setAttribute("href", `#${page.bookmark_id}`);
            a.setAttribute("class", "page-link-internal");
            a.textContent = title;
            component.replaceWith(a);
            return;
          }
          if (webBase) {
            const a = doc.createElement("a");
            a.setAttribute("href", `${webBase}/${id}`);
            a.setAttribute("class", "page-link-external");
            a.textContent = title;
            component.replaceWith(a);
            return;
          }
          const span = doc.createElement("span");
          span.setAttribute("class", "page-link-external");
          span.textContent = title;
          component.replaceWith(span);
        });
        return root.innerHTML;
      }
    } catch {
      // fall through to regex path
    }
  }

  return (html || "").replace(
    /<mention-component([^>]*?)>\s*<\/mention-component>|<mention-component([^>]*?)\s*\/>/gi,
    (full, attrsA?: string, attrsB?: string) => {
      const attrs = attrsA || attrsB || "";
      const idMatch = attrs.match(/entity_identifier=["']([^"']+)["']/i) || attrs.match(/\bid=["']([^"']+)["']/i);
      const entityMatch = attrs.match(/entity_name=["']([^"']+)["']/i);
      const entity = entityMatch?.[1] || "";
      const id = idMatch?.[1];
      if (!id || (entity && entity !== "page" && entity !== "page_mention")) {
        return "";
      }
      const page = byId.get(id);
      const title = escapeHtml(page?.name || getCachedPageMentionName(id) || labels.page);
      if (page) {
        return `<a href="#${page.bookmark_id}" class="page-link-internal">${title}</a>`;
      }
      if (webBase) {
        return `<a href="${webBase}/${id}" class="page-link-external">${title}</a>`;
      }
      return `<span class="page-link-external">${title}</span>`;
    }
  );
}

/** Collect page ids referenced by mention-components in HTML. */
export function extractMentionedPageIds(html: string | undefined | null): string[] {
  if (!html) return [];
  const ids = new Set<string>();
  const re = /<mention-component[^>]*?(?:entity_identifier|id)=["']([0-9a-fA-F-]{36})["'][^>]*?>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    ids.add(match[1]);
  }
  return [...ids];
}

/**
 * Keep pages referenced from the root content even when exporting "this page only",
 * so internal links still resolve.
 */
export function retainMentionedPages(tree: TExportTree, rootHtml?: string | null): TExportTree {
  const root = tree.pages.find((p) => p.id === tree.root);
  const html = rootHtml ?? root?.description_html ?? "";
  const mentioned = new Set(extractMentionedPageIds(html));
  if (!mentioned.size) {
    return {
      root: tree.root,
      pages: tree.pages
        .filter((p) => p.id === tree.root)
        .map((p) => Object.assign({}, p, { children_ids: [] as string[] })),
    };
  }
  const keep = new Set<string>([tree.root, ...mentioned]);
  return {
    root: tree.root,
    pages: tree.pages
      .filter((p) => keep.has(p.id))
      .map((p) =>
        p.id === tree.root
          ? Object.assign({}, p, {
              children_ids: (p.children_ids || []).filter((id) => keep.has(id)),
            })
          : Object.assign({}, p, { children_ids: [] as string[] })
      ),
  };
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

export function buildCombinedHtml(tree: TExportTree, options?: { includeToc?: boolean; webBaseUrl?: string }): string {
  const ordered = flattenExportTree(tree);
  const rtlDoc = treeIsRtl(tree);
  const labels = exportLabels(rtlDoc);
  const parts: string[] = [];
  if (options?.includeToc !== false) {
    // TOC heading follows majority; each entry is aligned by its own title script.
    parts.push(
      `<div><h1 class="page-title" dir="${rtlDoc ? "rtl" : "ltr"}" style="direction:${rtlDoc ? "rtl" : "ltr"};text-align:${rtlDoc ? "right" : "left"}">${labels.toc}</h1><ul class="toc" style="list-style-type:none;padding:0;margin:0">`
    );
    ordered.forEach((p, idx) => {
      const depth = getDepth(p, tree);
      const title = p.name || labels.untitled;
      const lineRtl = pageTitleLooksRtl(title, p.description_html);
      const dir = lineRtl ? "rtl" : "ltr";
      const align = lineRtl ? "right" : "left";
      const indent = depth * 12;
      parts.push(
        `<li dir="${dir}" style="direction:${dir};text-align:${align};margin-${lineRtl ? "right" : "left"}:${indent}px;margin-bottom:4px"><a href="#${p.bookmark_id}">${idx + 1}. ${escapeHtml(title)}</a></li>`
      );
    });
    parts.push(`</ul><div data-type="horizontalRule"></div></div>`);
  }
  ordered.forEach((p) => {
    const title = p.name || labels.untitled;
    // Title script when present; empty/untitled inherits body direction.
    const titleRtl = pageTitleLooksRtl(title, p.description_html);
    const body = applyInlineDirectionStyles(
      rewritePageMentionsToBookmarks(p.description_html || "<p></p>", tree.pages, titleRtl, {
        webBaseUrl: options?.webBaseUrl,
      })
    );
    // Destination id on the wrapper so PDF Link src="#id" can jump here.
    parts.push(
      `<div id="${p.bookmark_id}"><h1 class="page-title" dir="${titleRtl ? "rtl" : "ltr"}" style="direction:${titleRtl ? "rtl" : "ltr"};text-align:${titleRtl ? "right" : "left"}">${escapeHtml(title)}</h1>${body}</div>`
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
