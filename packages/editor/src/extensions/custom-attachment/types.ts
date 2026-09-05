/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Node } from "@tiptap/core";
// types
import type { TFileHandler } from "@/types";

export enum ECustomAttachmentAttributeNames {
  ID = "id",
  SOURCE = "src",
  ORIGINAL_NAME = "originalName",
  SIZE = "size",
  STATUS = "status",
}

export enum ECustomAttachmentStatus {
  PENDING = "pending",
  UPLOADING = "uploading",
  UPLOADED = "uploaded",
  DUPLICATING = "duplicating",
  DUPLICATION_FAILED = "duplication-failed",
}

export type TCustomAttachmentAttributes = {
  [ECustomAttachmentAttributeNames.ID]: string | null;
  [ECustomAttachmentAttributeNames.SOURCE]: string | null;
  [ECustomAttachmentAttributeNames.ORIGINAL_NAME]: string | null;
  [ECustomAttachmentAttributeNames.SIZE]: number | null;
  [ECustomAttachmentAttributeNames.STATUS]: ECustomAttachmentStatus;
};

export type UploadEntity = ({ event: "insert" } | { event: "drop"; file: File }) & { hasOpenedFileInputOnce?: boolean };

export type InsertAttachmentComponentProps = {
  file?: File;
  pos?: number;
  event: "insert" | "drop";
};

export type CustomAttachmentExtensionOptions = {
  getAttachmentDownloadSource: TFileHandler["getAssetDownloadSrc"];
  getAttachmentSource: TFileHandler["getAssetSrc"];
  restoreAttachment: TFileHandler["restore"];
  uploadAttachment?: TFileHandler["upload"];
  duplicateAttachment?: TFileHandler["duplicate"];
};

export type CustomAttachmentExtensionStorage = {
  fileMap: Map<string, UploadEntity>;
  deletedAttachmentSet: Map<string, boolean>;
  maxFileSize: number;
};

export type CustomAttachmentExtensionType = Node<CustomAttachmentExtensionOptions, CustomAttachmentExtensionStorage>;
