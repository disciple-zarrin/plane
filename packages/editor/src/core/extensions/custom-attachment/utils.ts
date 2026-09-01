/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Editor } from "@tiptap/core";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// local imports
import { ECustomAttachmentAttributeNames, ECustomAttachmentStatus } from "./types";
import type { TCustomAttachmentAttributes } from "./types";

export const DEFAULT_CUSTOM_ATTACHMENT_ATTRIBUTES: TCustomAttachmentAttributes = {
  [ECustomAttachmentAttributeNames.SOURCE]: null,
  [ECustomAttachmentAttributeNames.ID]: null,
  [ECustomAttachmentAttributeNames.ORIGINAL_NAME]: null,
  [ECustomAttachmentAttributeNames.SIZE]: null,
  [ECustomAttachmentAttributeNames.STATUS]: ECustomAttachmentStatus.PENDING,
};

export const getAttachmentComponentFileMap = (editor: Editor) =>
  editor.storage[CORE_EXTENSIONS.CUSTOM_ATTACHMENT]?.fileMap;

export const getAttachmentBlockId = (id: string) => `editor-attachment-block-${id}`;

export const isAttachmentDuplicating = (status: ECustomAttachmentStatus) =>
  status === ECustomAttachmentStatus.DUPLICATING;

export const isAttachmentDuplicationComplete = (status: ECustomAttachmentStatus) =>
  status === ECustomAttachmentStatus.UPLOADED || status === ECustomAttachmentStatus.DUPLICATION_FAILED;

export const hasAttachmentDuplicationFailed = (status: ECustomAttachmentStatus) =>
  status === ECustomAttachmentStatus.DUPLICATION_FAILED;

export const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};
