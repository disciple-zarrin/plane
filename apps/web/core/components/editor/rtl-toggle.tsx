/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { AlignLeft, AlignRight } from "lucide-react";
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/utils";

type Props = {
  isRtl: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  className?: string;
  /** Show text label so the control is easy to spot on issue pages. */
  showLabel?: boolean;
};

/** Document/task content direction toggle — independent of UI language. */
export function EditorRtlToggle(props: Props) {
  const { isRtl, onChange, disabled, className, showLabel = true } = props;
  const Icon = isRtl ? AlignRight : AlignLeft;
  const label = isRtl ? "RTL" : "LTR";
  const tip = isRtl ? "جهت متن: راست‌به‌چپ — کلیک برای LTR" : "جهت متن: چپ‌به‌راست — کلیک برای RTL";

  return (
    <Tooltip tooltipContent={tip}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!isRtl)}
        className={cn(
          "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border px-2 text-11 font-medium transition-colors",
          isRtl
            ? "border-accent-primary/40 bg-accent-primary/10 text-accent-primary"
            : "border-subtle bg-surface-1 text-secondary hover:bg-layer-transparent-hover hover:text-primary",
          disabled && "cursor-not-allowed opacity-50",
          !showLabel && "size-7 justify-center px-0",
          className
        )}
        aria-pressed={isRtl}
        aria-label={isRtl ? "Switch to LTR" : "Switch to RTL"}
      >
        <Icon className="size-3.5 shrink-0" />
        {showLabel && <span>{label}</span>}
      </button>
    </Tooltip>
  );
}
