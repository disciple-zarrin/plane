/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { AlignRight } from "lucide-react";
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/utils";

type Props = {
  isRtl: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  className?: string;
};

/** Document/task content direction toggle — independent of UI language. */
export function EditorRtlToggle(props: Props) {
  const { isRtl, onChange, disabled, className } = props;
  return (
    <Tooltip tooltipContent={isRtl ? "Direction: RTL (click for LTR)" : "Direction: LTR (click for RTL)"}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!isRtl)}
        className={cn(
          "grid size-7 shrink-0 place-items-center rounded-sm text-tertiary transition-colors",
          isRtl ? "bg-layer-transparent-selected text-primary" : "hover:bg-layer-transparent-hover",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
        aria-pressed={isRtl}
        aria-label={isRtl ? "Switch to LTR" : "Switch to RTL"}
      >
        <AlignRight className={cn("size-4", !isRtl && "scale-x-[-1]")} />
      </button>
    </Tooltip>
  );
}
