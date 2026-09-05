/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import type { TMarqueeRect } from "@/hooks/use-marquee-selection";

type Props = {
  rect: TMarqueeRect | null;
};

export const IssueSelectionOverlay: React.FC<Props> = ({ rect }) => {
  if (!rect || rect.width < 2 || rect.height < 2) return null;

  return (
    <div
      className="border-accent-primary/60 shadow-xs pointer-events-none fixed z-50 rounded-[2px] border bg-accent-primary/15"
      style={{
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
      }}
      aria-hidden="true"
    />
  );
};
