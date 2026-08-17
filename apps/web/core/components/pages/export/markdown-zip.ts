/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import JSZip from "jszip";
import { marked } from "marked";
import { convertHTMLToMarkdown } from "@plane/utils";
import type { TExportTree, TExportTreePage } from "@/services/page/page-export.service";
import { exportLabels, flattenExportTree, stripHtmlToText, treeIsRtl } from "./tree-utils";

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

async function extractAndRewriteImages(html: string, zip: JSZip): Promise<string> {
  // Plane editor stores images as <image-component src="assetId">; also handle plain <img>.
  const imgRe = /<(?:img|image-component)[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const urls = [...html.matchAll(imgRe)].map((m) => m[1]).filter(Boolean);
  const unique = [...new Set(urls)].filter((u) => u && !u.startsWith("data:") && !u.startsWith("./") && !u.startsWith("../"));

  const fetched = await Promise.all(
    unique.map(async (url, i) => {
      try {
        // Asset ids are resolved via signed URLs elsewhere; absolute http(s) fetch works for live URLs.
        const fetchUrl = url.startsWith("http") ? url : url;
        const res = await fetch(fetchUrl);
        if (!res.ok) return null;
        const buf = await res.arrayBuffer();
        const ext = (url.split("?")[0].split(".").pop() || "png").replace(/[^a-z0-9]/gi, "").slice(0, 4) || "png";
        const name = `img_${i}.${ext}`;
        zip.file(`assets/${name}`, buf);
        return { from: url, to: `../assets/${name}` };
      } catch {
        return null;
      }
    })
  );

  let result = html;
  for (const r of fetched) {
    if (r) result = result.split(r.from).join(r.to);
  }
  return result;
}

export async function buildMarkdownZipFromTree(tree: TExportTree): Promise<Blob> {
  const zip = new JSZip();
  const ordered = flattenExportTree(tree);
  const localeRtl = treeIsRtl(tree);
  const labels = exportLabels(localeRtl);
  const indexTitle = localeRtl ? "خروجی ویکی" : "Wiki export";
  const indexPages = localeRtl ? "صفحات" : "Pages";
  const indexLines = [`# ${indexTitle}`, "", `## ${indexPages}`, ""];

  const pageFiles = await Promise.all(
    ordered.map(async (page) => {
      let html = rewriteMentionsToRelativeLinks(page.description_html || "<p></p>", tree.pages, labels.page);
      html = await extractAndRewriteImages(html, zip);
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
      return { path: pageMdPath(page.id), content: frontmatter, name: page.name };
    })
  );

  for (const f of pageFiles) {
    zip.file(f.path, f.content);
    indexLines.push(`- [${f.name}](./${f.path})`);
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
  const zip = await JSZip.loadAsync(file);
  const mdFiles = Object.keys(zip.files).filter((n) => n.endsWith(".md") && !n.endsWith("index.md") && !zip.files[n].dir);

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
      let assetIndex = 0;
      for (const m of imgLinks) {
        const assetName = m[2];
        const assetFile = zip.file(`assets/${assetName}`) || zip.file(`assets/${decodeURIComponent(assetName)}`);
        if (!assetFile) continue;
        const placeholder = `IMG_PLACEHOLDER_${assetIndex++}_${assetName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const bytes = await assetFile.async("arraybuffer");
        assets.push({
          placeholder,
          name: assetName,
          mime: mimeForAssetName(assetName),
          bytes,
        });
        body = body.split(m[0]).join(`![image](${placeholder})`);
      }

      const htmlRaw = await marked.parse(body.replace(/^#\s.+\n+/, ""));
      let html = typeof htmlRaw === "string" ? htmlRaw : String(htmlRaw);
      // Convert placeholder <img> tags into Plane image-component shells (src still placeholder).
      for (const asset of assets) {
        const imgTagRe = new RegExp(`<img([^>]*?)src=["']${asset.placeholder}["']([^>]*)/?>`, "gi");
        html = html.replace(
          imgTagRe,
          `<image-component src="${asset.placeholder}" width="35%" height="auto" status="uploaded"></image-component>`
        );
      }

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

/** Stable parent-before-child order; pages whose parent is outside the ZIP become roots. */
export function topoSortParsedPages(pages: TParsedMdPage[]): TParsedMdPage[] {
  const byId = new Map(pages.filter((p) => p.id).map((p) => [p.id as string, p]));
  const visiting = new Set<string>();
  const done = new Set<string>();
  const ordered: TParsedMdPage[] = [];

  const visit = (page: TParsedMdPage) => {
    const key = page.id || page.filename;
    if (done.has(key)) return;
    if (visiting.has(key)) return;
    visiting.add(key);
    if (page.parent && byId.has(page.parent)) {
      visit(byId.get(page.parent)!);
    }
    visiting.delete(key);
    done.add(key);
    ordered.push(page);
  };

  for (const page of pages) visit(page);
  // Any pages without id that weren't visited
  for (const page of pages) {
    if (!done.has(page.id || page.filename)) ordered.push(page);
  }
  return ordered;
}
