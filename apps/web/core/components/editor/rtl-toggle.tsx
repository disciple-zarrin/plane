/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useState } from "react";
import type { RefObject } from "react";
import { AlignLeft, AlignRight } from "lucide-react";
import type { EditorRefApi } from "@plane/editor";
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/utils";

type Props = {
  editorRef: RefObject<EditorRefApi | null> | EditorRefApi | null;
  disabled?: boolean;
  className?: string;
};

function resolveEditor(editorRef: Props["editorRef"]): EditorRefApi | null {
  if (!editorRef) return null;
  if ("current" in editorRef) return editorRef.current;
  return editorRef;
}

/**
 * Word-style paragraph direction: applies LTR/RTL to the current block only.
 * New lines inherit the active paragraph direction until the user switches.
 */
export function EditorRtlToggle(props: Props) {
  const { editorRef, disabled, className } = props;
  const [active, setActive] = useState<"ltr" | "rtl">("ltr");
  const [ready, setReady] = useState(() => Boolean(resolveEditor(editorRef)));

  const refresh = useCallback(() => {
    const editor = resolveEditor(editorRef);
    if (!editor) {
      setReady(false);
      return;
    }
    setReady(true);
    const rtl = editor.isMenuItemActive({ itemKey: "text-direction", direction: "rtl" });
    setActive(rtl ? "rtl" : "ltr");
  }, [editorRef]);

  useEffect(() => {
    refresh();
    const editor = resolveEditor(editorRef);
    if (!editor) {
      // Editor mounts async; poll briefly until ref is ready.
      const id = window.setInterval(() => {
        if (resolveEditor(editorRef)) {
          refresh();
          window.clearInterval(id);
        }
      }, 200);
      return () => window.clearInterval(id);
    }
    return editor.onStateChange(refresh);
  }, [editorRef, refresh]);

  const setDirection = (direction: "ltr" | "rtl") => {
    const editor = resolveEditor(editorRef);
    if (!editor || disabled) return;
    editor.executeMenuItemCommand({ itemKey: "text-direction", direction });
    setActive(direction);
  };

  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      <Tooltip tooltipContent="جهت این پاراگراف: چپ‌به‌راست (LTR)">
        <button
          type="button"
          disabled={disabled || !ready}
          onClick={() => setDirection("ltr")}
          className={cn(
            "inline-flex h-7 items-center gap-1 rounded-md border px-2 text-11 font-medium transition-colors",
            active === "ltr"
              ? "border-accent-primary/40 bg-accent-primary/10 text-accent-primary"
              : "border-subtle bg-surface-1 text-secondary hover:bg-layer-transparent-hover hover:text-primary",
            (disabled || !ready) && "cursor-not-allowed opacity-50"
          )}
          aria-pressed={active === "ltr"}
          aria-label="Set paragraph direction to LTR"
        >
          <AlignLeft className="size-3.5 shrink-0" />
          <span>LTR</span>
        </button>
      </Tooltip>
      <Tooltip tooltipContent="جهت این پاراگراف: راست‌به‌چپ (RTL)">
        <button
          type="button"
          disabled={disabled || !ready}
          onClick={() => setDirection("rtl")}
          className={cn(
            "inline-flex h-7 items-center gap-1 rounded-md border px-2 text-11 font-medium transition-colors",
            active === "rtl"
              ? "border-accent-primary/40 bg-accent-primary/10 text-accent-primary"
              : "border-subtle bg-surface-1 text-secondary hover:bg-layer-transparent-hover hover:text-primary",
            (disabled || !ready) && "cursor-not-allowed opacity-50"
          )}
          aria-pressed={active === "rtl"}
          aria-label="Set paragraph direction to RTL"
        >
          <AlignRight className="size-3.5 shrink-0" />
          <span>RTL</span>
        </button>
      </Tooltip>
    </div>
  );
}
