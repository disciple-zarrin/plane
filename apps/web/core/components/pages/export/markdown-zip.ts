/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import JSZip from "jszip";
import { marked } from "marked";
import { convertHTMLToMarkdown } from "@plane/utils";
import type { TExportTree, TExportTreePage } from "@/services/page/page-export.service";
import { exportLabels, flattenExportTree, treeIsRtl } from "./tree-utils";

function pageMdPath(id: string) {
  return `pages/${id}.md`;
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
  const imgRe = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const urls = [...html.matchAll(imgRe)].map((m) => m[1]).filter(Boolean);
  const unique = [...new Set(urls)].filter((u) => u && !u.startsWith("data:") && !u.startsWith("./"));

  const fetched = await Promise.all(
    unique.map(async (url, i) => {
      try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const buf = await res.arrayBuffer();
        const ext = (url.split("?")[0].split(".").pop() || "png").slice(0, 4);
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
      const mdBody = convertHTMLToMarkdown({ description_html: html });
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

export type TParsedMdPage = {
  id?: string;
  parent?: string | null;
  title: string;
  html: string;
  filename: string;
};

export async function parseMarkdownZip(file: File): Promise<TParsedMdPage[]> {
  const zip = await JSZip.loadAsync(file);
  const mdFiles = Object.keys(zip.files).filter((n) => n.endsWith(".md") && n !== "index.md");

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

      const imgLinks = [...body.matchAll(/!\[[^\]]*]\((\.\/)?\.\.\/assets\/([^)]+)\)/g)];
      await Promise.all(
        imgLinks.map(async (m) => {
          const assetName = m[2];
          const assetFile = zip.file(`assets/${assetName}`);
          if (!assetFile) return;
          const base64 = await assetFile.async("base64");
          const mime = assetName.endsWith(".png")
            ? "image/png"
            : assetName.endsWith(".jpg") || assetName.endsWith(".jpeg")
              ? "image/jpeg"
              : "application/octet-stream";
          body = body.split(m[0]).join(`![image](data:${mime};base64,${base64})`);
        })
      );

      const html = await marked.parse(body.replace(/^#\s.+\n+/, ""));
      return {
        id,
        parent,
        title,
        html: typeof html === "string" ? html : String(html),
        filename: name,
      };
    })
  );
}
