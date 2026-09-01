/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Node } from "@tiptap/core";

export enum EBreadcrumbAttributeNames {
  ID = "id",
}

export type TBreadcrumbAttributes = {
  [EBreadcrumbAttributeNames.ID]: string;
};

export type CustomBreadcrumbExtensionOptions = Record<string, unknown>;
export type CustomBreadcrumbExtensionStorage = Record<string, unknown>;

export type CustomBreadcrumbExtensionType = Node<CustomBreadcrumbExtensionOptions, CustomBreadcrumbExtensionStorage>;
