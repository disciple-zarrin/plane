/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Placement } from "@popperjs/core";

export function getRTLPlacement(placement?: Placement): Placement {
  const isRTL =
    typeof document !== "undefined" &&
    (document.documentElement.dir === "rtl" ||
      document.body?.dir === "rtl" ||
      document.dir === "rtl");

  if (!isRTL) return placement ?? "bottom-start";

  const current = placement ?? "bottom-start";
  switch (current) {
    case "bottom-start":
      return "bottom-end";
    case "bottom-end":
      return "bottom-start";
    case "top-start":
      return "top-end";
    case "top-end":
      return "top-start";
    case "left-start":
      return "right-start";
    case "left-end":
      return "right-end";
    case "right-start":
      return "left-start";
    case "right-end":
      return "left-end";
    case "left":
      return "right";
    case "right":
      return "left";
    default:
      return current;
  }
}
