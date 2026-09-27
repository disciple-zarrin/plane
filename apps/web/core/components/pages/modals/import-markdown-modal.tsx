/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { CustomSelect, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import {
  importMarkdownZipToProject,
  importMarkdownZipToWiki,
} from "@/components/pages/export/import-markdown";
import { peekMarkdownZipPageCount } from "@/components/pages/export/markdown-zip";

export type TImportDestinationOption = {
  id: string;
  title: string;
  /** Visual indent for tree selects */
  depth?: number;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  context: "wiki" | "project";
  workspaceSlug: string;
  projectId?: string;
  destinationPageId: string;
  destinationPageTitle: string;
  /** When set, user can change destination before confirm (wiki list). */
  destinationOptions?: TImportDestinationOption[];
  onDestinationChange?: (pageId: string) => void;
  /** Refresh tree / store after success — no full window reload. */
  onSuccess?: () => void | Promise<void>;
};

export function ImportMarkdownModal(props: Props) {
  const {
    isOpen,
    onClose,
    context,
    workspaceSlug,
    projectId,
    destinationPageId,
    destinationPageTitle,
    destinationOptions,
    onDestinationChange,
    onSuccess,
  } = props;
  const { t } = useTranslation();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [peeking, setPeeking] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progressLabel, setProgressLabel] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setPageCount(null);
      setPeeking(false);
      setImporting(false);
      setProgressLabel("");
    }
  }, [isOpen]);

  const handleClose = () => {
    if (importing) return;
    onClose();
  };

  const handleFilePicked = async (picked: File | null) => {
    setFile(null);
    setPageCount(null);
    if (!picked) return;
    const lower = picked.name.toLowerCase();
    if (!lower.endsWith(".zip")) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("page_import.invalid_format_title"),
        message: t("page_import.invalid_format_message"),
      });
      return;
    }
    setFile(picked);
    setPeeking(true);
    try {
      const count = await peekMarkdownZipPageCount(picked);
      setPageCount(count);
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("page_import.read_zip_failed");
      setToast({ type: TOAST_TYPE.ERROR, title: t("page_import.invalid_zip_title"), message: msg });
      setFile(null);
      setPageCount(null);
    } finally {
      setPeeking(false);
    }
  };

  const handleImport = async () => {
    if (!file || !destinationPageId || !workspaceSlug) return;
    if (context === "project" && !projectId) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("page_import.import_failed_title"),
        message: t("page_import.missing_project_id"),
      });
      return;
    }

    setImporting(true);
    setProgressLabel("…");
    try {
      const onProgress = (p: { done: number; total: number; currentTitle?: string }) => {
        const title = p.currentTitle ? ` — ${p.currentTitle}` : "";
        setProgressLabel(`${p.done}/${p.total}${title}`);
      };

      const result =
        context === "wiki"
          ? await importMarkdownZipToWiki({
              file,
              workspaceSlug,
              destinationPageId,
              onProgress,
            })
          : await importMarkdownZipToProject({
              file,
              workspaceSlug,
              projectId: projectId as string,
              destinationPageId,
              onProgress,
            });

      const errorHint = result.errors.length ? `\n${result.errors.slice(0, 3).join("\n")}` : "";
      if (result.failed === 0) {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("page_import.import_success_title"),
          message: t("page_import.import_success_message", {
            createdCount: result.created,
            title: destinationPageTitle,
          }),
        });
      } else {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("page_import.import_partial_title"),
          message: `${t("page_import.import_partial_message", {
            createdCount: result.created,
            failedCount: result.failed,
          })}${errorHint}`,
        });
      }

      if (result.created > 0) {
        await onSuccess?.();
      }
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : undefined;
      setToast({ type: TOAST_TYPE.ERROR, title: t("page_import.import_failed_title"), message: msg });
    } finally {
      setImporting(false);
      setProgressLabel("");
    }
  };

  const canConfirm = Boolean(file && destinationPageId && !peeking && !importing && pageCount !== null && pageCount > 0);

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.SM}>
      <div>
        <div className="space-y-4 p-5">
          <h3 className="text-18 font-medium text-secondary">{t("page_import.title")}</h3>
          <p className="text-13 text-tertiary leading-relaxed">
            {t("page_import.description")}
          </p>

          {destinationOptions && destinationOptions.length > 0 ? (
            <div className="flex items-center justify-between gap-2">
              <h6 className="flex-shrink-0 text-13 text-secondary">{t("page_import.destination")}</h6>
              <CustomSelect
                label={destinationPageTitle || t("page_import.select_page")}
                buttonClassName="border-none max-w-[220px]"
                value={destinationPageId}
                onChange={(val: string) => onDestinationChange?.(val)}
                className="flex-shrink-0"
                placement="bottom-end"
                disabled={importing}
              >
                {destinationOptions.map((opt) => (
                  <CustomSelect.Option key={opt.id} value={opt.id}>
                    {"　".repeat(opt.depth ?? 0)}
                    {opt.title}
                  </CustomSelect.Option>
                ))}
              </CustomSelect>
            </div>
          ) : (
            <div className="rounded-md border border-subtle bg-surface-1 px-3 py-2 text-13 text-secondary">
              {t("page_import.destination_prefix")}<span className="font-medium text-primary">{destinationPageTitle || "—"}</span>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".zip,application/zip,application/x-zip-compressed"
            className="hidden"
            onChange={(e) => {
              const picked = e.target.files?.[0] ?? null;
              e.target.value = "";
              void handleFilePicked(picked);
            }}
          />

          <button
            type="button"
            disabled={importing}
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-subtle px-3 py-6 text-13 text-tertiary hover:border-accent-primary/40 hover:text-accent-primary"
          >
            <Upload className="size-4" />
            {file ? file.name : t("page_import.pick_zip")}
          </button>

          {peeking && <p className="text-12 text-tertiary">{t("page_import.peeking")}</p>}
          {!peeking && pageCount !== null && (
            <p className="text-13 text-secondary">
              {t("page_import.found_pages", { pageCount, title: destinationPageTitle })}
            </p>
          )}
          {importing && (
            <p className="text-13 text-accent-primary">{t("page_import.importing_status", { progress: progressLabel })}</p>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 border-t-[0.5px] border-subtle px-5 py-4">
          <Button variant="secondary" size="lg" onClick={handleClose} disabled={importing}>
            {t("cancel")}
          </Button>
          <Button variant="primary" size="lg" loading={importing} disabled={!canConfirm} onClick={() => void handleImport()}>
            {importing ? t("page_import.importing_btn") : t("page_import.confirm_btn")}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
}
