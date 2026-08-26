/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Node } from "@tiptap/core";

export enum EMathAttributeNames {
  ID = "id",
  LATEX = "latex",
}

export type TMathBlockAttributes = {
  [EMathAttributeNames.ID]: string;
  [EMathAttributeNames.LATEX]: string;
};

export type CustomMathExtensionOptions = Record<string, unknown>;
export type CustomMathExtensionStorage = Record<string, unknown>;

export type CustomMathExtensionType = Node<CustomMathExtensionOptions, CustomMathExtensionStorage>;
