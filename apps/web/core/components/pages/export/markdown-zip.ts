/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import JSZip from "jszip";
import { marked } from "marked";
import { convertHTMLToMarkdown, getAssetIdFromUrl, getEditorAssetSrc, getFileURL } from "@plane/utils";
import type { TExportTree, TExportTreePage } from "@/services/page/page-export.service";
import { exportLabels, flattenExportTree, stripHtmlToText, treeIsRtl } from "./tree-utils";

const MAX_ZIP_BYTES = 50 * 1024 * 1024;
const MAX_PAGES = 200;
const MAX_ASSETS_PER_PAGE = 100;
const MAX_ASSET_BYTES = 15 * 1024 * 1024;

export type TMarkdownZipBuildOptions = {
  workspaceSlug: string;
  projectId?: string;
};

type TAssetExportRegistry = {
  counter: number;
  /** Original src → ../assets/img_N.ext */
  rewritten: Map<string, string>;
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtmlText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sanitizeImportedHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html || "", "text/html");
  doc.querySelectorAll("script, iframe, object, embed, link[rel='import'], meta").forEach((el) => el.remove());
  doc.querySelectorAll("*").forEach((el) => {
    [...el.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase();
      if (name.startsWith("on")) el.removeAttribute(attr.name);
      if ((name === "href" || name === "src") && /^\s*javascript:/i.test(attr.value)) {
        el.removeAttribute(attr.name);
      }
    });
  });
  return doc.body.innerHTML;
}

/**
 * TipTap/document editor is most reliable with plain <p> blocks.
 * Prefer that for line-oriented docs; fall back to marked for richer markdown.
 */
function markdownBodyToEditorHtml(body: string): string {
  const withoutTitle = body.replace(/^#\s.+\n+/, "").trim();
  if (!withoutTitle) return "<p></p>";

  // Already HTML (from export tools) — sanitize and keep.
  if (/<(p|h[1-6]|ul|ol|li|blockquote|table|image-component|img)\b/i.test(withoutTitle)) {
    return sanitizeImportedHtml(withoutTitle) || "<p></p>";
  }

  const lines = withoutTitle
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  // Plain / numbered / bullet lines → one paragraph each (RTL-friendly).
  const looksPlain =
    lines.length > 0 &&
    lines.every((l) => !l.startsWith("```") && !l.startsWith("|") && !/^#{1,6}\s/.test(l));
  if (looksPlain) {
    return lines.map((line) => `<p dir="rtl">${escapeHtmlText(line)}</p>`).join("");
  }

  const htmlRaw = marked.parse(withoutTitle, { async: false }) as string;
  const html = sanitizeImportedHtml(typeof htmlRaw === "string" ? htmlRaw : String(htmlRaw));
  return html?.trim() ? html : "<p></p>";
}

function resolveAssetFetchUrl(src: string, opts: TMarkdownZipBuildOptions): string | null {
  if (!src || src.startsWith("data:")) return null;
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("blob:")) return src;

  let assetId = src;
  try {
    assetId = getAssetIdFromUrl(src);
  } catch {
    /* keep raw */
  }

  const fromEditor = getEditorAssetSrc({
    assetId,
    workspaceSlug: opts.workspaceSlug,
    projectId: opts.projectId,
  });
  if (fromEditor) return fromEditor;

  if (src.startsWith("/")) return getFileURL(src) ?? src;
  return getFileURL(src) ?? null;
}

function extFromUrlOrType(url: string, contentType: string | null): string {
  if (contentType?.includes("png")) return "png";
  if (contentType?.includes("jpeg") || contentType?.includes("jpg")) return "jpg";
  if (contentType?.includes("gif")) return "gif";
  if (contentType?.includes("webp")) return "webp";
  if (contentType?.includes("svg")) return "svg";
  const fromUrl = (url.split("?")[0].split(".").pop() || "").replace(/[^a-z0-9]/gi, "").slice(0, 4);
  if (fromUrl && ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(fromUrl.toLowerCase())) {
    return fromUrl.toLowerCase() === "jpeg" ? "jpg" : fromUrl.toLowerCase();
  }
  return "png";
}

function pageMdPath(id: string) {
  return `pages/${id}.md`;
}

function mimeForAssetName(assetName: string): string {
  const lower = assetName.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}

/**
 * Keep per-block dir in markdown as raw HTML paragraphs (GFM allows HTML).
 * Plain convertHTMLToMarkdown drops direction attributes.
 */
function htmlToMarkdownPreservingDirection(html: string): string {
  const blocks: string[] = [];
  // Preserve Plane image-components as markdown image links (src already rewritten to ../assets/...).
  const withMdImages = (html || "<p></p>").replace(
    /<image-component([^>]*?)(?:\/>|>\s*<\/image-component>)/gi,
    (_full, attrs: string) => {
      const src = (attrs.match(/\bsrc=["']([^"']+)["']/i) || [])[1];
      if (!src) return "";
      return `\n\n![image](${src})\n\n`;
    }
  );
  const cleaned = withMdImages.replace(/<\/?(section|div)[^>]*>/gi, "\n").replace(/<br\s*\/?>/gi, "\n");

  const re = /<(p|h[1-6]|li)(\s[^>]*)?>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;
  const matchedRanges: { start: number; end: number; out: string }[] = [];

  while ((match = re.exec(cleaned)) !== null) {
    const [full, tag, attrs = "", inner] = match;
    const dir = (attrs.match(/\bdir=["'](rtl|ltr)["']/i) || [])[1]?.toLowerCase();
    const text = stripHtmlToText(inner);
    if (!text) continue;
    if (dir) {
      matchedRanges.push({
        start: match.index,
        end: match.index + full.length,
        out: `\n\n<${tag} dir="${dir}">${text}</${tag}>\n\n`,
      });
    } else {
      const mdTag = tag.toLowerCase();
      let out = text;
      if (mdTag === "h1") out = `# ${text}`;
      else if (mdTag === "h2") out = `## ${text}`;
      else if (mdTag === "h3") out = `### ${text}`;
      else if (mdTag === "h4") out = `#### ${text}`;
      else if (mdTag === "li") out = `- ${text}`;
      matchedRanges.push({
        start: match.index,
        end: match.index + full.length,
        out: `\n\n${out}\n\n`,
      });
    }
  }

  if (!matchedRanges.length) {
    return convertHTMLToMarkdown({ description_html: html });
  }

  let cursor = 0;
  for (const range of matchedRanges) {
    if (range.start > cursor) {
      const gap = cleaned.slice(cursor, range.start);
      if (stripHtmlToText(gap) || /!\[[^\]]*]\([^)]+\)/.test(gap)) {
        const mdGap = convertHTMLToMarkdown({ description_html: gap });
        blocks.push(mdGap || gap.trim());
      }
    }
    blocks.push(range.out.trim());
    cursor = range.end;
  }
  if (cursor < cleaned.length) {
    const gap = cleaned.slice(cursor);
    if (stripHtmlToText(gap) || /!\[[^\]]*]\([^)]+\)/.test(gap)) {
      const mdGap = convertHTMLToMarkdown({ description_html: gap });
      blocks.push(mdGap || gap.trim());
    }
  }
  return blocks.filter(Boolean).join("\n\n");
}

function rewriteMentionsToRelativeLinks(html: string, pages: TExportTreePage[], fallbackTitle: string): string {
  const byId = new Map(pages.map((p) => [p.id, p]));
  return html.replace(/<mention-component([^>]*?)>/gi, (_full, attrs: string) => {
    const idMatch = attrs.match(/entity_identifier=["']([^"']+)["']/i) || attrs.match(/\bid=["']([^"']+)["']/i);
    const entityMatch = attrs.match(/entity_name=["']([^"']+)["']/i);
    const entity = entityMatch?.[1] || "";
    const id = idMatch?.[1];
    if (!id || (entity && entity !== "page" && entity !== "page_mention")) return "";
    const page = byId.get(id);
    const title = page?.name || fallbackTitle;
    return `<a href="./${id}.md">${title}</a>`;
  });
}

async function extractAndRewriteImages(
  html: string,
  zip: JSZip,
  opts: TMarkdownZipBuildOptions,
  registry: TAssetExportRegistry
): Promise<string> {
  // Plane editor stores images as <image-component src="assetId">; also handle plain <img>.
  const imgRe = /<(?:img|image-component)[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const urls = [...html.matchAll(imgRe)].map((m) => m[1]).filter(Boolean);
  const unique = [...new Set(urls)].filter(
    (u) => u && !u.startsWith("data:") && !u.startsWith("./") && !u.startsWith("../")
  );

  for (const url of unique) {
    if (registry.rewritten.has(url)) continue;
    try {
      const fetchUrl = resolveAssetFetchUrl(url, opts);
      if (!fetchUrl) continue;
      const res = await fetch(fetchUrl, { credentials: "include" });
      if (!res.ok) continue;
      const buf = await res.arrayBuffer();
      const ext = extFromUrlOrType(url, res.headers.get("content-type"));
      const name = `img_${registry.counter++}.${ext}`;
      zip.file(`assets/${name}`, buf);
      registry.rewritten.set(url, `../assets/${name}`);
    } catch {
      /* skip failed asset */
    }
  }

  let result = html;
  for (const [from, to] of registry.rewritten) {
    if (result.includes(from)) result = result.split(from).join(to);
  }
  return result;
}

export async function buildMarkdownZipFromTree(
  tree: TExportTree,
  opts: TMarkdownZipBuildOptions
): Promise<Blob> {
  const zip = new JSZip();
  const ordered = flattenExportTree(tree);
  const localeRtl = treeIsRtl(tree);
  const labels = exportLabels(localeRtl);
  const indexTitle = localeRtl ? "خروجی ویکی" : "Wiki export";
  const indexPages = localeRtl ? "صفحات" : "Pages";
  const indexLines = [`# ${indexTitle}`, "", `## ${indexPages}`, ""];
  const registry: TAssetExportRegistry = { counter: 0, rewritten: new Map() };

  // Sequential so shared assets get one global name (no img_0 clobber across pages).
  for (const page of ordered) {
    let html = rewriteMentionsToRelativeLinks(page.description_html || "<p></p>", tree.pages, labels.page);
    html = await extractAndRewriteImages(html, zip, opts, registry);
    const mdBody = htmlToMarkdownPreservingDirection(html);
    const frontmatter = [
      "---",
      `id: ${page.id}`,
      `parent: ${page.parent ?? "null"}`,
      `title: ${JSON.stringify(page.name || labels.untitled)}`,
      "---",
      "",
      `# ${page.name || labels.untitled}`,
      "",
      mdBody,
      "",
    ].join("\n");
    const path = pageMdPath(page.id);
    zip.file(path, frontmatter);
    indexLines.push(`- [${page.name || labels.untitled}](./${path})`);
  }

  zip.file("index.md", `${indexLines.join("\n")}\n`);
  return zip.generateAsync({ type: "blob" });
}

export type TParsedMdAsset = {
  /** Unique placeholder used in html before upload. */
  placeholder: string;
  name: string;
  mime: string;
  bytes: ArrayBuffer;
};

export type TParsedMdPage = {
  id?: string;
  parent?: string | null;
  title: string;
  /** HTML with `IMG_PLACEHOLDER_*` image srcs still to be uploaded. */
  html: string;
  filename: string;
  assets: TParsedMdAsset[];
};

export async function parseMarkdownZip(file: File): Promise<TParsedMdPage[]> {
  if (file.size > MAX_ZIP_BYTES) {
    throw new Error(`حجم فایل زیپ بیش از حد مجاز است (حداکثر ${MAX_ZIP_BYTES / (1024 * 1024)} مگابایت).`);
  }

  const zip = await JSZip.loadAsync(file);
  // Prefer pages/*.md; never treat TOC-only index.md as a page.
  const mdFiles = Object.keys(zip.files).filter(
    (n) =>
      n.endsWith(".md") &&
      !zip.files[n].dir &&
      n !== "index.md" &&
      !n.endsWith("/index.md") &&
      (n.startsWith("pages/") || !n.includes("/"))
  );

  if (mdFiles.length > MAX_PAGES) {
    throw new Error(`تعداد صفحات بیش از حد مجاز است (حداکثر ${MAX_PAGES}).`);
  }

  return Promise.all(
    mdFiles.map(async (name) => {
      const raw = await zip.files[name].async("string");
      const fm = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      let id: string | undefined;
      let parent: string | null | undefined;
      let title = name.replace(/\.md$/, "").split("/").pop() || "Untitled";
      let body = raw;
      if (fm) {
        const meta = fm[1];
        body = fm[2];
        id = meta.match(/^id:\s*(.+)$/m)?.[1]?.trim();
        const parentRaw = meta.match(/^parent:\s*(.+)$/m)?.[1]?.trim();
        parent = !parentRaw || parentRaw === "null" ? null : parentRaw;
        const titleMatch = meta.match(/^title:\s*(.+)$/m)?.[1]?.trim();
        if (titleMatch) {
          try {
            title = JSON.parse(titleMatch);
          } catch {
            title = titleMatch.replace(/^"|"$/g, "");
          }
        }
      }

      const assets: TParsedMdAsset[] = [];
      const imgLinks = [...body.matchAll(/!\[[^\]]*]\((\.\/)?\.\.\/assets\/([^)]+)\)/g)];
      if (imgLinks.length > MAX_ASSETS_PER_PAGE) {
        throw new Error(`تعداد تصاویر صفحه «${title}» بیش از حد مجاز است.`);
      }
      let assetIndex = 0;
      for (const m of imgLinks) {
        const assetName = m[2];
        const assetFile = zip.file(`assets/${assetName}`) || zip.file(`assets/${decodeURIComponent(assetName)}`);
        if (!assetFile) {
          throw new Error(`فایل پیوست یافت نشد: assets/${assetName} (صفحه «${title}»)`);
        }
        const bytes = await assetFile.async("arraybuffer");
        if (bytes.byteLength > MAX_ASSET_BYTES) {
          throw new Error(`فایل پیوست بیش از حد بزرگ است: assets/${assetName}`);
        }
        const placeholder = `IMG_PLACEHOLDER_${assetIndex++}_${assetName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        assets.push({
          placeholder,
          name: assetName,
          mime: mimeForAssetName(assetName),
          bytes,
        });
        body = body.split(m[0]).join(`![image](${placeholder})`);
      }

      let html = markdownBodyToEditorHtml(body);
      // Convert placeholder <img> tags into Plane image-component shells (src still placeholder).
      for (const asset of assets) {
        const imgTagRe = new RegExp(
          `<img([^>]*?)src=["']${escapeRegExp(asset.placeholder)}["']([^>]*)/?>`,
          "gi"
        );
        html = html.replace(
          imgTagRe,
          `<image-component src="${asset.placeholder}" width="35%" height="auto" status="uploaded"></image-component>`
        );
      }
      if (!html?.trim()) html = "<p></p>";

      return {
        id,
        parent,
        title,
        html,
        filename: name,
        assets,
      };
    })
  );
}

/** Stable parent-before-child order; pages whose parent is outside the ZIP become roots. Cycles → parent cleared. */
export function topoSortParsedPages(pages: TParsedMdPage[]): TParsedMdPage[] {
  const byId = new Map(pages.filter((p) => p.id).map((p) => [p.id as string, p]));
  const visiting = new Set<string>();
  const done = new Set<string>();
  const ordered: TParsedMdPage[] = [];

  const visit = (page: TParsedMdPage) => {
    const key = page.id || page.filename;
    if (done.has(key)) return;
    if (visiting.has(key)) {
      // Cycle: detach so import can proceed under destination.
      page.parent = null;
      return;
    }
    visiting.add(key);
    if (page.parent && byId.has(page.parent)) {
      visit(byId.get(page.parent)!);
    }
    visiting.delete(key);
    done.add(key);
    ordered.push(page);
  };

  for (const page of pages) visit(page);
  for (const page of pages) {
    if (!done.has(page.id || page.filename)) ordered.push(page);
  }
  return ordered;
}
