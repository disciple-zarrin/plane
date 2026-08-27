/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { FileIcon, RotateCcw, Upload, Link2, Loader2, ArrowRight } from "lucide-react";
import type { ChangeEvent } from "react";
import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
// plane imports
import { cn } from "@plane/utils";
// constants
import { ACCEPTED_ATTACHMENT_MIME_TYPES } from "@/constants/config";
import { CORE_EXTENSIONS } from "@/constants/extension";
// helpers
import type { EFileError } from "@/helpers/file";
// hooks
import { useUploader, useDropZone, uploadFirstFileAndInsertRemaining } from "@/hooks/use-file-upload";
// local imports
import { ECustomAttachmentStatus } from "../types";
import { formatBytes, getAttachmentComponentFileMap } from "../utils";
import type { CustomAttachmentNodeViewProps } from "./node-view";

type CustomAttachmentUploaderProps = CustomAttachmentNodeViewProps & {
  failedToLoadAttachment: boolean;
  hasDuplicationFailed: boolean;
  maxFileSize: number;
  setIsUploaded: (isUploaded: boolean) => void;
};

export function CustomAttachmentUploader(props: CustomAttachmentUploaderProps) {
  const {
    editor,
    extension,
    failedToLoadAttachment,
    getPos,
    maxFileSize,
    node,
    selected,
    setIsUploaded,
    updateAttributes,
    hasDuplicationFailed,
  } = props;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasTriggeredFilePickerRef = useRef(false);
  const hasTriedUploadingOnMountRef = useRef(false);
  const { id: attachmentEntityId } = node.attrs;

  const [activeTab, setActiveTab] = useState<"upload" | "embed">("upload");
  const [embedUrl, setEmbedUrl] = useState("");
  const [uploadPercent, setUploadPercent] = useState(0);

  const attachmentComponentFileMap = useMemo(() => getAttachmentComponentFileMap(editor), [editor]);
  const isTouchDevice = !editor.storage.utility.isTouchDevice;

  const onUpload = useCallback(
    (url: string, file?: File) => {
      if (url) {
        if (!attachmentEntityId) return;
        setUploadPercent(100);
        setIsUploaded(true);
        updateAttributes({
          src: url,
          originalName: file?.name ?? node.attrs.originalName ?? "File",
          size: file?.size ?? node.attrs.size ?? 0,
          status: ECustomAttachmentStatus.UPLOADED,
        });
        attachmentComponentFileMap?.delete(attachmentEntityId);

        const pos = getPos();
        const getCurrentSelection = editor.state.selection;
        const currentNode = editor.state.doc.nodeAt(getCurrentSelection.from);

        if (
          currentNode &&
          currentNode.type.name === node.type.name &&
          currentNode.attrs.src === url &&
          pos !== undefined
        ) {
          const nextNode = editor.state.doc.nodeAt(pos + 1);

          if (nextNode && nextNode.type.name === CORE_EXTENSIONS.PARAGRAPH) {
            editor.commands.setTextSelection(pos + 1);
          } else {
            editor.commands.createParagraphNear();
          }
        }
      }
    },
    [
      attachmentComponentFileMap,
      attachmentEntityId,
      updateAttributes,
      getPos,
      editor,
      node.type.name,
      node.attrs.originalName,
      node.attrs.size,
      setIsUploaded,
    ]
  );

  const uploadAttachmentEditorCommand = useCallback(
    async (file: File) => {
      setUploadPercent(10);
      updateAttributes({
        status: ECustomAttachmentStatus.UPLOADING,
        originalName: file.name,
        size: file.size,
      });

      // Simulate smooth progress bar updates
      const progressInterval = setInterval(() => {
        setUploadPercent((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 15;
        });
      }, 150);

      try {
        const res = await extension.options.uploadAttachment?.(attachmentEntityId ?? "", file);
        clearInterval(progressInterval);
        setUploadPercent(100);
        return res;
      } catch (err) {
        clearInterval(progressInterval);
        throw err;
      }
    },
    [extension.options, attachmentEntityId, updateAttributes]
  );

  const handleProgressStatus = useCallback(
    (isUploading: boolean) => {
      editor.storage.utility.uploadInProgress = isUploading;
    },
    [editor]
  );

  const handleInvalidFile = useCallback((_error: EFileError, _file: File, message: string) => {
    alert(message);
  }, []);

  const { isUploading, uploadFile } = useUploader({
    acceptedMimeTypes: ACCEPTED_ATTACHMENT_MIME_TYPES,
    editorCommand: uploadAttachmentEditorCommand,
    handleProgressStatus,
    maxFileSize,
    onInvalidFile: handleInvalidFile,
    onUpload,
  });

  const { draggedInside, onDrop, onDragEnter, onDragLeave } = useDropZone({
    editor,
    getPos,
    type: "attachment",
    uploader: uploadFile,
  });

  useEffect(() => {
    if (hasTriedUploadingOnMountRef.current) return;

    const meta = attachmentComponentFileMap?.get(attachmentEntityId ?? "");
    if (meta) {
      if (meta.event === "drop" && "file" in meta) {
        hasTriedUploadingOnMountRef.current = true;
        uploadFile(meta.file);
      } else if (meta.event === "insert" && fileInputRef.current && !hasTriggeredFilePickerRef.current) {
        if (meta.hasOpenedFileInputOnce) return;
        if (!isTouchDevice) {
          fileInputRef.current.click();
        }
        hasTriggeredFilePickerRef.current = true;
        attachmentComponentFileMap?.set(attachmentEntityId ?? "", { ...meta, hasOpenedFileInputOnce: true });
      }
    } else {
      hasTriedUploadingOnMountRef.current = true;
    }
  }, [attachmentEntityId, isTouchDevice, uploadFile, attachmentComponentFileMap]);

  const onFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      const filesList = e.target.files;
      const pos = getPos();
      if (!filesList || pos === undefined) {
        return;
      }
      await uploadFirstFileAndInsertRemaining({
        editor,
        filesList,
        pos,
        type: "attachment",
        uploader: uploadFile,
      });
    },
    [uploadFile, editor, getPos]
  );

  const handleEmbedSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!embedUrl.trim()) return;

      const trimmed = embedUrl.trim();
      const filename = trimmed.split("/").pop()?.split("?")[0] || "Embedded Media";
      setIsUploaded(true);
      updateAttributes({
        src: trimmed,
        originalName: filename,
        status: ECustomAttachmentStatus.UPLOADED,
      });
    },
    [embedUrl, setIsUploaded, updateAttributes]
  );

  const isErrorState = failedToLoadAttachment || hasDuplicationFailed;

  const borderColor =
    selected && editor.isEditable && !isErrorState
      ? "color-mix(in srgb, var(--border-color-accent-strong) 20%, transparent)"
      : undefined;

  const handleRetryClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (hasDuplicationFailed && editor.isEditable) {
        updateAttributes({ status: ECustomAttachmentStatus.DUPLICATING });
      }
    },
    [hasDuplicationFailed, editor.isEditable, updateAttributes]
  );

  return (
    <div
      contentEditable={false}
      className={cn(
        "my-3 flex w-full max-w-2xl flex-col overflow-hidden rounded-xl border bg-layer-1 text-tertiary transition-all duration-200 ease-in-out",
        {
          "border-subtle": !(selected && editor.isEditable && !isErrorState),
          "ring-accent-primary border-transparent ring-2": selected && editor.isEditable && !isErrorState,
          "border-danger-primary bg-danger-primary/5 text-danger-primary": isErrorState,
        }
      )}
      style={{ borderColor }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Tab Navigation */}
      {!isUploading && !isErrorState && (
        <div className="text-xs flex items-center border-b border-subtle bg-layer-2 px-3 py-1.5 select-none">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={() => setActiveTab("upload")}
              className={cn("flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors", {
                "shadow-sm bg-layer-1 text-primary": activeTab === "upload",
                "text-tertiary hover:text-secondary": activeTab !== "upload",
              })}
            >
              <Upload className="size-3.5" />
              <span>بارگذاری فایل (Upload)</span>
            </button>

            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={() => setActiveTab("embed")}
              className={cn("flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors", {
                "shadow-sm bg-layer-1 text-primary": activeTab === "embed",
                "text-tertiary hover:text-secondary": activeTab !== "embed",
              })}
            >
              <Link2 className="size-3.5" />
              <span>جاسازی از لینک (Embed Link)</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {isUploading ? (
        /* Progress Bar View */
        <div className="flex flex-col gap-3 p-4">
          <div className="text-xs flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium text-primary">
              <Loader2 className="size-4 animate-spin text-accent-primary" />
              <span>در حال بارگذاری {node.attrs.originalName ? `"${node.attrs.originalName}"` : "فایل"}...</span>
              {node.attrs.size ? <span className="text-tertiary">({formatBytes(node.attrs.size)})</span> : null}
            </div>
            <span className="font-semibold text-accent-primary">{uploadPercent}%</span>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-layer-3">
            <div
              className="h-full bg-accent-primary transition-all duration-300 ease-out"
              style={{ width: `${uploadPercent}%` }}
            />
          </div>
        </div>
      ) : activeTab === "upload" ? (
        /* Upload / Dropzone Tab */
        <div
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 p-6 transition-colors hover:bg-layer-2/50",
            {
              "bg-layer-3/50 text-secondary": draggedInside && editor.isEditable && !isErrorState,
            }
          )}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (!isTouchDevice && editor.isEditable && !isErrorState) {
              fileInputRef.current?.click();
            }
          }}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={onDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept={ACCEPTED_ATTACHMENT_MIME_TYPES.join(",")}
            onChange={onFileChange}
          />

          <div className="grid h-10 w-10 place-items-center rounded-full bg-layer-2 text-tertiary">
            {hasDuplicationFailed ? (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={handleRetryClick}
                className="grid place-items-center p-1 text-danger-primary"
              >
                <RotateCcw className="size-5" />
              </button>
            ) : (
              <FileIcon className="size-5 text-accent-primary" />
            )}
          </div>

          <div className="text-center">
            <p className="text-sm font-medium text-primary">
              {draggedInside ? "فایل را اینجا رها کنید" : "برای انتخاب کلیک کنید یا فایل را بکشید و رها کنید"}
            </p>
            <p className="text-xs mt-0.5 text-tertiary">پشتیبانی از انواع ویدیو، صوت، PDF، عکس و اسناد فشرده</p>
          </div>
        </div>
      ) : (
        /* Embed URL Tab */
        <form onSubmit={handleEmbedSubmit} className="flex flex-col gap-3 p-4" onMouseDown={(e) => e.stopPropagation()}>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={embedUrl}
              onChange={(e) => setEmbedUrl(e.target.value)}
              onMouseDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="آدرس اینترنتی فایل یا لینک ویدیو/صوت (URL)..."
              className="text-xs focus:border-accent-primary flex-1 rounded-lg border border-subtle bg-layer-1 px-3 py-2 text-primary placeholder:text-tertiary focus:outline-none"
              autoFocus
            />
            <button
              type="submit"
              disabled={!embedUrl.trim()}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              className="text-xs flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-accent-primary px-4 py-2 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <span>جاسازی</span>
              <ArrowRight className="size-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-tertiary">
            می‌توانید لینک مستقیم فایل ویدیویی یا صوتی را وارد کرده و درون صفحه مشاهده کنید.
          </p>
        </form>
      )}
    </div>
  );
}
