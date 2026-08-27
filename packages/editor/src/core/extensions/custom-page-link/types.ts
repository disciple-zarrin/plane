/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Node } from "@tiptap/core";
import type { TMentionHandler } from "@/types";

export enum EPageLinkAttributeNames {
  ID = "id",
  TITLE = "title",
  URL = "url",
}

export type TPageLinkAttributes = {
  [EPageLinkAttributeNames.ID]: string;
  [EPageLinkAttributeNames.TITLE]: string;
  [EPageLinkAttributeNames.URL]: string;
};

export type CustomPageLinkExtensionOptions = {
  mentionHandler?: TMentionHandler;
  [key: string]: unknown;
};

export type CustomPageLinkExtensionStorage = Record<string, unknown>;

export type CustomPageLinkExtensionType = Node<CustomPageLinkExtensionOptions, CustomPageLinkExtensionStorage>;
