/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { FileIcon, RotateCcw } from "lucide-react";
import type { ChangeEvent } from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";
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
import { getAttachmentComponentFileMap } from "../utils";
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
  
  const attachmentComponentFileMap = useMemo(() => getAttachmentComponentFileMap(editor), [editor]);
  const isTouchDevice = !!editor.storage.utility.isTouchDevice;

  const onUpload = useCallback(
    (url: string) => {
      if (url) {
        if (!attachmentEntityId) return;
        setIsUploaded(true);
        updateAttributes({
          src: url,
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
    [attachmentComponentFileMap, attachmentEntityId, updateAttributes, getPos, editor, node.type.name]
  );

  const uploadAttachmentEditorCommand = useCallback(
    async (file: File) => {
      updateAttributes({ 
        status: ECustomAttachmentStatus.UPLOADING,
        originalName: file.name,
        size: file.size
      });
      return await extension.options.uploadAttachment?.(attachmentEntityId ?? "", file);
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

  const isErrorState = failedToLoadAttachment || hasDuplicationFailed;

  const borderColor =
    selected && editor.isEditable && !isErrorState
      ? "color-mix(in srgb, var(--border-color-accent-strong) 20%, transparent)"
      : undefined;

  const getDisplayMessage = useCallback(() => {
    if (isErrorState) {
      return "Error loading attachment";
    }

    if (isUploading) {
      return node.attrs.originalName ? `Uploading ${node.attrs.originalName}...` : "Uploading...";
    }

    if (draggedInside && editor.isEditable) {
      return "Drop file or media here";
    }

    return "Add a file or media";
  }, [draggedInside, editor.isEditable, isErrorState, isUploading, node.attrs.originalName]);

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
      className={cn(
        "flex cursor-default items-center justify-start gap-2 rounded-lg border border-dashed bg-layer-3 px-2 py-3 text-tertiary transition-all duration-200 ease-in-out",
        {
          "border-subtle": !(selected && editor.isEditable && !isErrorState),
          "cursor-pointer hover:bg-layer-3-hover hover:text-secondary": editor.isEditable && !isErrorState,
          "bg-layer-3-hover text-secondary": draggedInside && editor.isEditable && !isErrorState,
          "bg-accent-primary/10 text-accent-secondary hover:bg-accent-primary/10 hover:text-accent-secondary":
            selected && editor.isEditable && !isErrorState,
          "border-danger-primary bg-danger-primary/10 text-danger-primary hover:bg-danger-primary/10 hover:text-danger-primary":
            isErrorState,
        }
      )}
      style={{
        borderColor,
      }}
      onClick={() => {
        if (!isTouchDevice && editor.isEditable && !isErrorState && !isUploading) {
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

      <span className="flex-shrink-0 grid place-items-center h-6 w-6">
        {hasDuplicationFailed ? (
          <button type="button" onClick={handleRetryClick} className="grid place-items-center rounded bg-danger-primary/10 p-1 text-danger-primary hover:bg-danger-primary/20">
            <RotateCcw className="size-4" />
          </button>
        ) : (
          <FileIcon className="size-4" />
        )}
      </span>

      <span className="text-sm font-medium">{getDisplayMessage()}</span>
    </div>
  );
}
