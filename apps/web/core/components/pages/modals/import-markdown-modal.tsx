/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
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
        title: "فرمت نامعتبر",
        message: "فقط فایل ZIP خروجی Markdown پذیرفته می‌شود.",
      });
      return;
    }
    setFile(picked);
    setPeeking(true);
    try {
      const count = await peekMarkdownZipPageCount(picked);
      setPageCount(count);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "خواندن ZIP ناموفق بود.";
      setToast({ type: TOAST_TYPE.ERROR, title: "ZIP نامعتبر", message: msg });
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
        title: "ایمپورت ناموفق",
        message: "شناسه پروژه در دسترس نیست.",
      });
      return;
    }

    setImporting(true);
    setProgressLabel("شروع…");
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
          title: "ایمپورت شد",
          message: `${result.created} صفحه زیر «${destinationPageTitle}» ساخته شد.`,
        });
      } else {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "ایمپورت ناقص",
          message: `${result.created} موفق، ${result.failed} ناموفق${errorHint}`,
        });
      }

      if (result.created > 0) {
        await onSuccess?.();
      }
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : undefined;
      setToast({ type: TOAST_TYPE.ERROR, title: "ایمپورت ناموفق", message: msg });
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
          <h3 className="text-18 font-medium text-secondary">ایمپورت ZIP مارک‌داون</h3>
          <p className="text-13 text-tertiary leading-relaxed">
            فایل ZIP خروجی همین سیستم را انتخاب کنید. صفحات جدید به‌صورت فرزند زیر صفحهٔ مقصد ساخته
            می‌شوند (بازنویسی درجا نیست).
          </p>

          {destinationOptions && destinationOptions.length > 0 ? (
            <div className="flex items-center justify-between gap-2">
              <h6 className="flex-shrink-0 text-13 text-secondary">صفحهٔ مقصد</h6>
              <CustomSelect
                label={destinationPageTitle || "انتخاب صفحه"}
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
              مقصد: <span className="font-medium text-primary">{destinationPageTitle || "—"}</span>
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
            {file ? file.name : "انتخاب فایل ZIP"}
          </button>

          {peeking && <p className="text-12 text-tertiary">در حال خواندن ZIP…</p>}
          {!peeking && pageCount !== null && (
            <p className="text-13 text-secondary">
              {pageCount} صفحه در ZIP یافت شد — زیر «{destinationPageTitle}» ساخته می‌شوند.
            </p>
          )}
          {importing && (
            <p className="text-13 text-accent-primary">در حال ایمپورت… {progressLabel}</p>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 border-t-[0.5px] border-subtle px-5 py-4">
          <Button variant="secondary" size="lg" onClick={handleClose} disabled={importing}>
            انصراف
          </Button>
          <Button variant="primary" size="lg" loading={importing} disabled={!canConfirm} onClick={() => void handleImport()}>
            {importing ? "در حال ایمپورت…" : "تأیید ایمپورت"}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
}
