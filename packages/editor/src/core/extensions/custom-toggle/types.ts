/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Node } from "@tiptap/core";

export enum EToggleAttributeNames {
  ID = "data-toggle-id",
  IS_OPEN = "data-is-open",
}

export type TToggleBlockAttributes = {
  [EToggleAttributeNames.ID]: string;
  [EToggleAttributeNames.IS_OPEN]: boolean;
};

export type CustomToggleExtensionOptions = Record<string, unknown>;
export type CustomToggleExtensionStorage = Record<string, unknown>;

export type CustomToggleExtensionType = Node<CustomToggleExtensionOptions, CustomToggleExtensionStorage>;
