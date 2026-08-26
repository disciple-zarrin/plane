/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Node } from "@tiptap/core";

export enum EEmbedAttributeNames {
  ID = "id",
  SRC = "src",
  ORIGINAL_URL = "originalUrl",
  PROVIDER = "provider",
}

export type TEmbedAttributes = {
  [EEmbedAttributeNames.ID]: string;
  [EEmbedAttributeNames.SRC]: string;
  [EEmbedAttributeNames.ORIGINAL_URL]: string;
  [EEmbedAttributeNames.PROVIDER]:
    | "youtube"
    | "aparat"
    | "figma"
    | "codepen"
    | "spotify"
    | "soundcloud"
    | "generic";
};

export type CustomEmbedExtensionOptions = Record<string, unknown>;
export type CustomEmbedExtensionStorage = Record<string, unknown>;

export type CustomEmbedExtensionType = Node<
  CustomEmbedExtensionOptions,
  CustomEmbedExtensionStorage
>;
