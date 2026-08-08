/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import type { PageProps } from "@react-pdf/renderer";
import { pdf } from "@react-pdf/renderer";
import { Controller, useForm } from "react-hook-form";
import { useParams } from "react-router";
import type { EditorRefApi } from "@plane/editor";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { CustomSelect, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { PDFDocument } from "@/components/editor/pdf";
import { buildDocxFromTree } from "@/components/pages/export/docx-builder";
import { buildMarkdownZipFromTree } from "@/components/pages/export/markdown-zip";
import {
  buildCombinedHtml,
  escapeHtml,
  flattenExportTree,
  injectLiveRootHtml,
  pageIsRtl,
  retainMentionedPages,
  rewritePageMentionsToBookmarks,
  sanitizeHtmlForPdf,
  treeIsRtl,
} from "@/components/pages/export/tree-utils";
import { cachePageMentionName } from "@/components/editor/embeds/mentions/page-cache";
import { useParseEditorContent } from "@/hooks/use-parse-editor-content";
import { PageExportService } from "@/services/page/page-export.service";
import type { TExportTree } from "@/services/page/page-export.service";

type Props = {
  editorRef: EditorRefApi | null;
  isOpen: boolean;
  onClose: () => void;
  pageTitle: string;
  /** When set, enables tree export (PDF/DOCX/MD zip with subpages). */
  pageId?: string;
  /** wiki = workspace pages; project = project pages */
  exportContext?: "wiki" | "project";
  /** Live editor RTL toggle — overrides API value for the root page. */
  isRtl?: boolean;
};

type TExportFormats = "pdf" | "markdown" | "docx";
type TPageFormats = Exclude<PageProps["size"], undefined>;
type TContentVariety = "everything" | "no-assets";
type TExportScope = "this_page" | "page_and_subpages";

type TFormValues = {
  export_format: TExportFormats;
  page_format: TPageFormats;
  content_variety: TContentVariety;
  export_scope: TExportScope;
};

const EXPORT_FORMATS: { key: TExportFormats; label: string }[] = [
  { key: "pdf", label: "PDF" },
  { key: "docx", label: "Word (DOCX)" },
  { key: "markdown", label: "Markdown (+ تصاویر)" },
];

const PAGE_FORMATS: { key: TPageFormats; label: string }[] = [
  { key: "A4", label: "A4" },
  { key: "A3", label: "A3" },
  { key: "LETTER", label: "Letter" },
];

const CONTENT_VARIETY: { key: TContentVariety; label: string }[] = [
  { key: "everything", label: "همه چیز" },
  { key: "no-assets", label: "بدون تصویر" },
];

const EXPORT_SCOPES: { key: TExportScope; label: string }[] = [
  { key: "this_page", label: "فقط این صفحه" },
  { key: "page_and_subpages", label: "این صفحه + صفحات فرعی" },
];

const defaultValues: TFormValues = {
  export_format: "pdf",
  page_format: "A4",
  content_variety: "everything",
  export_scope: "page_and_subpages",
};

const exportService = new PageExportService();

function initiateDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ExportPageModal(props: Props) {
  const { editorRef, isOpen, onClose, pageTitle, pageId, exportContext = "project", isRtl } = props;
  const [isExporting, setIsExporting] = useState(false);
  const { workspaceSlug, projectId } = useParams();
  const { control, reset, watch } = useForm<TFormValues>({ defaultValues });
  const { replaceCustomComponentsFromHTMLContent, replaceCustomComponentsFromMarkdownContent } = useParseEditorContent({
    projectId,
    workspaceSlug: workspaceSlug ?? "",
  });

  const selectedExportFormat = watch("export_format");
  const selectedPageFormat = watch("page_format");
  const selectedContentVariety = watch("content_variety");
  const selectedScope = watch("export_scope");
  const isPDFSelected = selectedExportFormat === "pdf";
  const fileName =
    pageTitle
      ?.toLowerCase()
      ?.replace(/[^a-z0-9-_آ-ی]/gi, "-")
      .replace(/-+/g, "-") || "page";

  const handleClose = () => {
    onClose();
    setTimeout(() => reset(), 300);
  };

  const fetchTree = async () => {
    if (!workspaceSlug || !pageId) throw new Error("missing page");
    if (exportContext === "wiki") {
      return exportService.fetchWikiTree(workspaceSlug.toString(), pageId);
    }
    if (!projectId) throw new Error("missing project");
    return exportService.fetchProjectTree(workspaceSlug.toString(), projectId.toString(), pageId);
  };

  const scopeTree = (tree: TExportTree, liveHtml?: string | null): TExportTree => {
    // Warm page-name cache for mention labels in export.
    tree.pages.forEach((p) => {
      if (p.id && p.name) cachePageMentionName(p.id, p.name);
    });
    if (selectedScope !== "this_page") return tree;
    return retainMentionedPages(tree, liveHtml);
  };

  const prepareTree = async (): Promise<TExportTree> => {
    if (!pageId) throw new Error("missing page");
    const liveHtml = editorRef?.getDocument()?.html;
    const withLive = injectLiveRootHtml(await fetchTree(), liveHtml, pageTitle, isRtl);
    return scopeTree(withLive, liveHtml);
  };

  const webBaseUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${workspaceSlug || ""}${
          exportContext === "wiki" ? "/wiki" : projectId ? `/projects/${projectId}/pages` : "/wiki"
        }`
      : "";

  const handleExportAsPDF = async () => {
    if (pageId) {
      const tree = await prepareTree();
      const combined =
        selectedScope === "page_and_subpages"
          ? buildCombinedHtml(tree, { includeToc: true, webBaseUrl })
          : (() => {
              const root = flattenExportTree(tree)[0];
              const title = root?.name || pageTitle;
              const rtl = pageIsRtl(root);
              const body = rewritePageMentionsToBookmarks(root?.description_html || "<p></p>", tree.pages, rtl, {
                webBaseUrl,
              });
              // Include sibling/mentioned page sections so #bookmarks resolve in PDF.
              const extras = flattenExportTree(tree)
                .slice(1)
                .map((p) => {
                  const pRtl = pageIsRtl(p);
                  const pBody = rewritePageMentionsToBookmarks(p.description_html || "<p></p>", tree.pages, pRtl, {
                    webBaseUrl,
                  });
                  return `<div id="${p.bookmark_id}"><h1 class="page-title">${escapeHtml(p.name || title)}</h1>${pBody}</div>`;
                })
                .join("\n");
              const rootId = root?.bookmark_id ? ` id="${root.bookmark_id}"` : "";
              return sanitizeHtmlForPdf(
                `<div${rootId}><h1 class="page-title" dir="${rtl ? "rtl" : "ltr"}" style="direction:${rtl ? "rtl" : "ltr"};text-align:${rtl ? "right" : "left"}">${escapeHtml(title)}</h1>${body}</div>${extras}`
              );
            })();
      const parsed = await replaceCustomComponentsFromHTMLContent({
        htmlContent: combined,
        noAssets: selectedContentVariety === "no-assets",
      });
      const blob = await pdf(
        <PDFDocument content={sanitizeHtmlForPdf(parsed)} pageFormat={selectedPageFormat} isRtl={treeIsRtl(tree)} />
      ).toBlob();
      initiateDownload(blob, selectedScope === "page_and_subpages" ? `${fileName}-tree.pdf` : `${fileName}.pdf`);
      return;
    }

    const liveHtml = editorRef?.getDocument()?.html ?? "<p></p>";
    const rtl = Boolean(isRtl) || /dir=["']rtl["']/i.test(liveHtml);
    const pageContent = sanitizeHtmlForPdf(
      `<div><h1 class="page-title" dir="${rtl ? "rtl" : "ltr"}" style="direction:${rtl ? "rtl" : "ltr"};text-align:${rtl ? "right" : "left"}">${escapeHtml(pageTitle)}</h1>${liveHtml}</div>`
    );
    const parsedPageContent = await replaceCustomComponentsFromHTMLContent({
      htmlContent: pageContent,
      noAssets: selectedContentVariety === "no-assets",
    });
    const blob = await pdf(
      <PDFDocument content={sanitizeHtmlForPdf(parsedPageContent)} pageFormat={selectedPageFormat} isRtl={rtl} />
    ).toBlob();
    initiateDownload(blob, `${fileName}.pdf`);
  };

  const handleExportAsMarkdown = async () => {
    if (pageId) {
      const tree = await prepareTree();
      const blob = await buildMarkdownZipFromTree(tree);
      initiateDownload(blob, `${fileName}-export.zip`);
      return;
    }
    const liveMd = editorRef?.getMarkDown() ?? "";
    const parsedMarkdownContent = replaceCustomComponentsFromMarkdownContent({
      markdownContent: liveMd,
      noAssets: selectedContentVariety === "no-assets",
    });
    const blob = new Blob([parsedMarkdownContent], { type: "text/markdown" });
    initiateDownload(blob, `${fileName}.md`);
  };

  const handleExportAsDocx = async () => {
    if (!pageId) {
      const html = editorRef?.getDocument()?.html ?? "<p></p>";
      const tree: TExportTree = {
        root: "current",
        pages: [
          {
            id: "current",
            name: pageTitle,
            parent: null,
            description_html: html,
            description_json: {},
            children_ids: [],
            bookmark_id: "page_current",
            is_rtl: Boolean(isRtl),
          },
        ],
      };
      const blob = await buildDocxFromTree(tree, { webBaseUrl });
      initiateDownload(blob, `${fileName}.docx`);
      return;
    }
    const tree = await prepareTree();
    const blob = await buildDocxFromTree(tree, { webBaseUrl });
    initiateDownload(blob, `${fileName}.docx`);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (selectedExportFormat === "pdf") await handleExportAsPDF();
      if (selectedExportFormat === "markdown") await handleExportAsMarkdown();
      if (selectedExportFormat === "docx") await handleExportAsDocx();
      setToast({ type: TOAST_TYPE.SUCCESS, title: "موفق", message: "خروجی آماده شد." });
      handleClose();
    } catch (error) {
      console.error(error);
      setToast({ type: TOAST_TYPE.ERROR, title: "خطا", message: "خروجی گرفته نشد." });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.SM}>
      <div>
        <div className="space-y-5 p-5">
          <h3 className="text-18 font-medium text-secondary">خروجی صفحه</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h6 className="flex-shrink-0 text-13 text-secondary">فرمت</h6>
              <Controller
                control={control}
                name="export_format"
                render={({ field: { onChange, value } }) => (
                  <CustomSelect
                    label={EXPORT_FORMATS.find((f) => f.key === value)?.label}
                    buttonClassName="border-none"
                    value={value}
                    onChange={(val: TExportFormats) => onChange(val)}
                    className="flex-shrink-0"
                    placement="bottom-end"
                  >
                    {EXPORT_FORMATS.map((format) => (
                      <CustomSelect.Option key={format.key} value={format.key}>
                        {format.label}
                      </CustomSelect.Option>
                    ))}
                  </CustomSelect>
                )}
              />
            </div>
            {pageId && (
              <div className="flex items-center justify-between gap-2">
                <h6 className="flex-shrink-0 text-13 text-secondary">محدوده</h6>
                <Controller
                  control={control}
                  name="export_scope"
                  render={({ field: { onChange, value } }) => (
                    <CustomSelect
                      label={EXPORT_SCOPES.find((s) => s.key === value)?.label}
                      buttonClassName="border-none"
                      value={value}
                      onChange={(val: TExportScope) => onChange(val)}
                      className="flex-shrink-0"
                      placement="bottom-end"
                    >
                      {EXPORT_SCOPES.map((s) => (
                        <CustomSelect.Option key={s.key} value={s.key}>
                          {s.label}
                        </CustomSelect.Option>
                      ))}
                    </CustomSelect>
                  )}
                />
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              <h6 className="flex-shrink-0 text-13 text-secondary">محتوا</h6>
              <Controller
                control={control}
                name="content_variety"
                render={({ field: { onChange, value } }) => (
                  <CustomSelect
                    label={CONTENT_VARIETY.find((v) => v.key === value)?.label}
                    buttonClassName="border-none"
                    value={value}
                    onChange={(val: TContentVariety) => onChange(val)}
                    className="flex-shrink-0"
                    placement="bottom-end"
                  >
                    {CONTENT_VARIETY.map((variety) => (
                      <CustomSelect.Option key={variety.key} value={variety.key}>
                        {variety.label}
                      </CustomSelect.Option>
                    ))}
                  </CustomSelect>
                )}
              />
            </div>
            {isPDFSelected && (
              <div className="flex items-center justify-between gap-2">
                <h6 className="flex-shrink-0 text-13 text-secondary">اندازه صفحه</h6>
                <Controller
                  control={control}
                  name="page_format"
                  render={({ field: { onChange, value } }) => (
                    <CustomSelect
                      label={PAGE_FORMATS.find((f) => f.key === value)?.label}
                      buttonClassName="border-none"
                      value={value}
                      onChange={(val: TPageFormats) => onChange(val)}
                      className="flex-shrink-0"
                      placement="bottom-end"
                    >
                      {PAGE_FORMATS.map((format) => (
                        <CustomSelect.Option key={format.key.toString()} value={format.key}>
                          {format.label}
                        </CustomSelect.Option>
                      ))}
                    </CustomSelect>
                  )}
                />
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t-[0.5px] border-subtle px-5 py-4">
          <Button variant="secondary" size="lg" onClick={handleClose}>
            انصراف
          </Button>
          <Button variant="primary" size="lg" loading={isExporting} onClick={handleExport}>
            {isExporting ? "در حال خروجی…" : "خروجی"}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
}
