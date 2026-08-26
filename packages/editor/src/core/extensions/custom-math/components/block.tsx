/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import { Sigma, Check, Copy, Edit2 } from "lucide-react";
import React, { useState, useCallback, useRef, useEffect } from "react";
// plane imports
import { cn } from "@plane/utils";
// types
import type { TMathBlockAttributes } from "../types";
import { EMathAttributeNames } from "../types";

export type CustomMathNodeViewProps = NodeViewProps & {
  node: NodeViewProps["node"] & {
    attrs: TMathBlockAttributes;
  };
  updateAttributes: (attrs: Partial<TMathBlockAttributes>) => void;
};

export function CustomMathBlock(props: CustomMathNodeViewProps) {
  const { editor, node, updateAttributes, selected } = props;
  const latex = node.attrs[EMathAttributeNames.LATEX] || "E = mc^2";

  const [isEditing, setIsEditing] = useState(false);
  const [tempLatex, setTempLatex] = useState(latex);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTempLatex(latex);
  }, [latex]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = useCallback(() => {
    updateAttributes({
      [EMathAttributeNames.LATEX]: tempLatex.trim() || "E = mc^2",
    });
    setIsEditing(false);
  }, [tempLatex, updateAttributes]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      setTempLatex(latex);
      setIsEditing(false);
    }
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(latex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <NodeViewWrapper className="editor-math-component my-3 select-none">
      <div
        contentEditable={false}
        onClick={() => {
          if (editor.isEditable && !isEditing) {
            setIsEditing(true);
          }
        }}
        className={cn(
          "group relative flex w-full flex-col items-center justify-center rounded-xl border border-subtle bg-layer-2 p-5 transition-all cursor-pointer",
          {
            "ring-2 ring-accent-primary border-transparent": selected && editor.isEditable,
            "hover:border-strong hover:bg-layer-2-hover": !selected && !isEditing,
            "border-accent-primary bg-layer-1": isEditing,
          }
        )}
      >
        {/* Actions top-right */}
        {!isEditing && (
          <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={handleCopy}
              className="grid h-7 w-7 place-items-center rounded-md text-tertiary transition hover:bg-layer-3 hover:text-primary"
              title="کپی فرمول LaTeX"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            {editor.isEditable && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="grid h-7 w-7 place-items-center rounded-md text-tertiary transition hover:bg-layer-3 hover:text-primary"
                title="ویرایش فرمول"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Formula Rendering Mode */}
        {!isEditing ? (
          <div className="flex flex-col items-center gap-1 py-1">
            <div className="flex items-center gap-2">
              <Sigma className="h-4 w-4 text-accent-primary opacity-60" />
              <span className="font-serif text-lg tracking-wide text-primary italic font-medium">
                {latex}
              </span>
            </div>
            <span className="text-[10px] text-tertiary opacity-0 transition-opacity group-hover:opacity-100">
              برای ویرایش فرمول کلیک کنید
            </span>
          </div>
        ) : (
          /* Formula Editing Form */
          <div className="flex w-full max-w-md flex-col gap-3 py-1" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <Sigma className="h-4 w-4 text-accent-primary" />
              <span>فرمول ریاضی (LaTeX Equation)</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={tempLatex}
                onChange={(e) => setTempLatex(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="مثال: \int_{0}^{\infty} e^{-x^2} dx یا E = mc^2"
                className="w-full rounded-lg border border-subtle bg-layer-2 px-3 py-1.5 font-mono text-sm text-primary placeholder:text-tertiary focus:border-accent-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSave}
                className="shrink-0 rounded-lg bg-accent-primary px-3 py-1.5 text-xs font-medium text-white shadow transition hover:bg-accent-primary/90"
              >
                ثبت
              </button>
            </div>
            <span className="text-[11px] text-tertiary">
              راهنما: کلید Enter برای ذخیره و Esc برای انصراف
            </span>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}
