/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Node } from "@tiptap/core";

export enum ECustomBookmarkAttributeNames {
  ID = "id",
  URL = "url",
  TITLE = "title",
  DESCRIPTION = "description",
  FAVICON = "favicon",
}

export type TCustomBookmarkAttributes = {
  [ECustomBookmarkAttributeNames.ID]: string | null;
  [ECustomBookmarkAttributeNames.URL]: string | null;
  [ECustomBookmarkAttributeNames.TITLE]: string | null;
  [ECustomBookmarkAttributeNames.DESCRIPTION]: string | null;
  [ECustomBookmarkAttributeNames.FAVICON]: string | null;
};

export type InsertBookmarkComponentProps = {
  url?: string;
  title?: string;
  description?: string;
  pos?: number;
};

export type CustomBookmarkExtensionOptions = Record<string, unknown>;
export type CustomBookmarkExtensionStorage = Record<string, unknown>;

export type CustomBookmarkExtensionType = Node<CustomBookmarkExtensionOptions, CustomBookmarkExtensionStorage>;
