/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Node } from "@tiptap/core";

export enum EColumnsAttributeNames {
  ID = "id",
  COUNT = "count",
}

export type TColumnsAttributes = {
  [EColumnsAttributeNames.ID]: string;
  [EColumnsAttributeNames.COUNT]: number;
};

export type CustomColumnsExtensionOptions = Record<string, unknown>;
export type CustomColumnsExtensionStorage = Record<string, unknown>;

export type CustomColumnsExtensionType = Node<CustomColumnsExtensionOptions, CustomColumnsExtensionStorage>;
