/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
import { usePopper } from "react-popper";
import type { Placement, Modifier } from "@popperjs/core";
import { useTranslation } from "@plane/i18n";

/**
 * Automatically mirror placement for RTL (e.g. Persian/Farsi) layouts.
 * In RTL, "bottom-start" (bottom-left) should be "bottom-end" (bottom-right)
 * so popovers open aligned to the start of text and don't overflow the right screen edge.
 */
export function getRTLPlacement(placement?: Placement, isRTLOverride?: boolean): Placement {
  const isRTL =
    isRTLOverride ??
    (typeof document !== "undefined" &&
      (document.documentElement.dir === "rtl" ||
        document.body?.dir === "rtl" ||
        document.dir === "rtl"));

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

export type TDropdownPopperOptions = {
  placement?: Placement;
  offset?: [number, number];
  padding?: number;
  strategy?: "fixed" | "absolute";
  modifiers?: Modifier<any, any>[];
};

/**
 * Universal hook for positioning dropdowns and popovers across Plane.
 * - Automatically respects Persian/RTL direction
 * - Uses strategy: "fixed" to avoid containing-block / overflow-clipping traps
 * - Employs proper Popper offset modifier instead of CSS margins
 * - Provides safe collision detection and responsive flipping for mobile
 */
export function useDropdownPopper(
  referenceElement: HTMLElement | null,
  popperElement: HTMLElement | null,
  options?: TDropdownPopperOptions
) {
  const { currentLocale } = useTranslation();
  const isRTL =
    currentLocale === "fa" ||
    (typeof document !== "undefined" &&
      (document.documentElement.dir === "rtl" ||
        document.body?.dir === "rtl" ||
        document.dir === "rtl"));

  const resolvedPlacement = getRTLPlacement(options?.placement ?? "bottom-start", isRTL);
  const strategy = options?.strategy ?? "fixed";
  const offsetDistance = options?.offset ?? [0, 4];
  const padding = options?.padding ?? 12;

  const defaultModifiers = useMemo(
    () => [
      {
        name: "offset",
        options: {
          offset: offsetDistance,
        },
      },
      {
        name: "preventOverflow",
        options: {
          padding,
          altAxis: true,
        },
      },
      {
        name: "flip",
        options: {
          padding,
          fallbackPlacements: [
            resolvedPlacement === "bottom-end" ? "bottom-start" : "bottom-end",
            resolvedPlacement.startsWith("bottom")
              ? (resolvedPlacement.replace("bottom", "top") as Placement)
              : (resolvedPlacement.replace("top", "bottom") as Placement),
            resolvedPlacement === "bottom-end" ? "top-start" : "top-end",
          ],
        },
      },
      ...(options?.modifiers ?? []),
    ],
    [offsetDistance, padding, resolvedPlacement, options?.modifiers]
  );

  return usePopper(referenceElement, popperElement, {
    placement: resolvedPlacement,
    strategy,
    modifiers: defaultModifiers,
  });
}
