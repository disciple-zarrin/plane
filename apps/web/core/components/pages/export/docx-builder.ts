/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Bookmark,
  InternalHyperlink,
  ExternalHyperlink,
  AlignmentType,
} from "docx";
import type { TExportTree } from "@/services/page/page-export.service";
import {
  exportLabels,
  flattenExportTree,
  pageIsRtl,
  rewritePageMentionsToBookmarks,
  stripHtmlToText,
  treeIsRtl,
} from "./tree-utils";

function depthOf(pageId: string, tree: TExportTree): number {
  const byId = new Map(tree.pages.map((p) => [p.id, p]));
  let d = 0;
  let cur: string | null = byId.get(pageId)?.parent ?? null;
  while (cur && byId.has(cur) && d < 20) {
    d += 1;
    cur = byId.get(cur)?.parent ?? null;
  }
  return d;
}

const HEADING_BY_DEPTH = [
  HeadingLevel.HEADING_1,
  HeadingLevel.HEADING_2,
  HeadingLevel.HEADING_3,
  HeadingLevel.HEADING_4,
  HeadingLevel.HEADING_5,
];

function parseInline(html: string, isRtl: boolean): (TextRun | InternalHyperlink | ExternalHyperlink)[] {
  const labels = exportLabels(isRtl);
  const runs: (TextRun | InternalHyperlink | ExternalHyperlink)[] = [];
  const parts = html.split(/(<a\s+[^>]*>.*?<\/a>)/gi);
  for (const part of parts) {
    const linkMatch = part.match(/<a\s+([^>]*)>(.*?)<\/a>/i);
    if (linkMatch) {
      const attrs = linkMatch[1];
      const text = stripHtmlToText(linkMatch[2]) || labels.link;
      const href = attrs.match(/href=["']([^"']+)["']/i)?.[1] || "";
      if (href.startsWith("#")) {
        runs.push(
          new InternalHyperlink({
            anchor: href.slice(1),
            children: [new TextRun({ text, style: "Hyperlink", color: "0563C1", underline: {}, rightToLeft: isRtl })],
          })
        );
      } else if (href) {
        runs.push(
          new ExternalHyperlink({
            link: href,
            children: [new TextRun({ text, style: "Hyperlink", color: "0563C1", underline: {}, rightToLeft: isRtl })],
          })
        );
      } else {
        runs.push(new TextRun({ text, rightToLeft: isRtl }));
      }
      continue;
    }
    const text = stripHtmlToText(part);
    if (text) runs.push(new TextRun({ text, rightToLeft: isRtl }));
  }
  return runs.length ? runs : [new TextRun({ text: "" })];
}

function htmlToParagraphs(html: string, isRtl: boolean): Paragraph[] {
  const cleaned = html
    .replace(/<\/?(section|div)[^>]*>/gi, "")
    .replace(/<br\s*\/?>/gi, "</p><p>");
  const blocks = cleaned.split(/<\/p>|<\/h[1-6]>|<\/li>/i);
  const paragraphs: Paragraph[] = [];
  for (const block of blocks) {
    const trimmed = block.replace(/<p[^>]*>/gi, "").trim();
    if (!trimmed || !stripHtmlToText(trimmed)) continue;
    paragraphs.push(
      new Paragraph({
        bidirectional: isRtl,
        alignment: isRtl ? AlignmentType.RIGHT : AlignmentType.LEFT,
        spacing: { after: 120 },
        children: parseInline(trimmed, isRtl),
      })
    );
  }
  return paragraphs;
}

export async function buildDocxFromTree(tree: TExportTree): Promise<Blob> {
  const ordered = flattenExportTree(tree);
  const docRtl = treeIsRtl(tree);
  const labels = exportLabels(docRtl);
  const align = docRtl ? AlignmentType.RIGHT : AlignmentType.LEFT;
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      bidirectional: docRtl,
      alignment: align,
      children: [new TextRun({ text: labels.toc, bold: true, size: 32, rightToLeft: docRtl })],
    })
  );

  ordered.forEach((p, idx) => {
    const indent = depthOf(p.id, tree);
    children.push(
      new Paragraph({
        bidirectional: docRtl,
        alignment: align,
        indent: docRtl ? { right: indent * 200 } : { left: indent * 200 },
        children: [
          new InternalHyperlink({
            anchor: p.bookmark_id,
            children: [
              new TextRun({
                text: `${idx + 1}. ${p.name || labels.untitled}`,
                style: "Hyperlink",
                color: "0563C1",
                underline: {},
                rightToLeft: docRtl,
              }),
            ],
          }),
        ],
      })
    );
  });

  children.push(new Paragraph({ children: [] }));

  for (const page of ordered) {
    const rtl = pageIsRtl(page);
    const depth = Math.min(depthOf(page.id, tree), HEADING_BY_DEPTH.length - 1);
    children.push(
      new Paragraph({
        heading: HEADING_BY_DEPTH[depth],
        bidirectional: rtl,
        alignment: rtl ? AlignmentType.RIGHT : AlignmentType.LEFT,
        children: [
          new Bookmark({
            id: page.bookmark_id,
            children: [
              new TextRun({
                text: page.name || labels.untitled,
                bold: true,
                rightToLeft: rtl,
              }),
            ],
          }),
        ],
      })
    );
    const body = rewritePageMentionsToBookmarks(page.description_html || "<p></p>", tree.pages, rtl);
    children.push(...htmlToParagraphs(body, rtl));
    children.push(new Paragraph({ children: [] }));
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  return Packer.toBlob(doc);
}
