/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Node } from "@tiptap/core";

export enum ETableOfContentsAttributeNames {
  ID = "id",
}

export type TTableOfContentsAttributes = {
  [ETableOfContentsAttributeNames.ID]: string;
};

export type TOCHeadingItem = {
  id: string;
  text: string;
  level: number;
  pos: number;
};

export type CustomTableOfContentsExtensionOptions = Record<string, unknown>;
export type CustomTableOfContentsExtensionStorage = Record<string, unknown>;

export type CustomTableOfContentsExtensionType = Node<
  CustomTableOfContentsExtensionOptions,
  CustomTableOfContentsExtensionStorage
>;
