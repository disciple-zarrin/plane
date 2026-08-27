/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import { CheckIcon, ChevronDown } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { CopyIcon } from "@plane/propel/icons";
// ui
import { Tooltip } from "@plane/propel/tooltip";
// plane utils
import { cn } from "@plane/utils";
// types
import type { TCodeBlockAttributes } from "./types";
import { ECodeBlockAttributeNames } from "./types";

const LANGUAGES = [
  { label: "Plain Text", value: "plaintext" },
  { label: "TypeScript", value: "typescript" },
  { label: "JavaScript", value: "javascript" },
  { label: "Python", value: "python" },
  { label: "HTML", value: "html" },
  { label: "CSS", value: "css" },
  { label: "JSON", value: "json" },
  { label: "Bash / Shell", value: "bash" },
  { label: "SQL", value: "sql" },
  { label: "Go", value: "go" },
  { label: "Rust", value: "rust" },
  { label: "Java", value: "java" },
  { label: "C++", value: "cpp" },
  { label: "YAML", value: "yaml" },
  { label: "Markdown", value: "markdown" },
];

export function CodeBlockComponent(props: NodeViewProps) {
  const { node, updateAttributes, editor } = props;
  const [copied, setCopied] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // derived values
  const attrs = node.attrs as TCodeBlockAttributes;
  const currentLang = attrs[ECodeBlockAttributeNames.LANGUAGE] || "plaintext";
  const currentLangLabel =
    LANGUAGES.find((l) => l.value.toLowerCase() === currentLang.toLowerCase())?.label || currentLang || "Plain Text";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsLangOpen(false);
      }
    };
    if (isLangOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isLangOpen]);

  const copyToClipboard = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    try {
      await navigator.clipboard.writeText(node.textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch {
      setCopied(false);
    }
    e.preventDefault();
    e.stopPropagation();
  };

  const handleSelectLanguage = (langValue: string) => {
    if (typeof updateAttributes === "function") {
      updateAttributes({
        [ECodeBlockAttributeNames.LANGUAGE]: langValue,
      });
    }
    setIsLangOpen(false);
  };

  return (
    <NodeViewWrapper key={attrs[ECodeBlockAttributeNames.ID]} className="code-block group/code relative my-3">
      {/* Header bar / Actions */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 opacity-0 transition-opacity duration-150 group-hover/code:opacity-100 focus-within:opacity-100">
        {/* Language Selector Dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            contentEditable={false}
            onClick={() => editor.isEditable && setIsLangOpen((prev) => !prev)}
            disabled={!editor.isEditable}
            className={cn(
              "shadow-sm flex h-7 items-center gap-1 rounded-md border border-subtle bg-layer-1 px-2 text-[11px] font-medium text-secondary transition hover:bg-layer-2 hover:text-primary",
              !editor.isEditable && "cursor-default"
            )}
          >
            <span>{currentLangLabel}</span>
            {editor.isEditable && <ChevronDown className="h-3 w-3 opacity-60" />}
          </button>

          {isLangOpen && (
            <div
              contentEditable={false}
              className="shadow-lg absolute top-8 right-0 z-50 max-h-56 w-36 overflow-y-auto rounded-lg border border-subtle bg-layer-1 p-1 ring-1 ring-black/5 dark:ring-white/10"
            >
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.value}
                  type="button"
                  onClick={() => handleSelectLanguage(lang.value)}
                  className={cn(
                    "text-xs flex w-full items-center justify-between rounded px-2 py-1 text-left transition hover:bg-layer-2",
                    currentLang.toLowerCase() === lang.value.toLowerCase()
                      ? "bg-accent-primary/10 font-semibold text-accent-primary"
                      : "text-secondary hover:text-primary"
                  )}
                >
                  <span>{lang.label}</span>
                  {currentLang.toLowerCase() === lang.value.toLowerCase() && (
                    <CheckIcon className="h-3 w-3 text-accent-primary" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Copy Button */}
        <Tooltip tooltipContent="Copy code">
          <button
            type="button"
            contentEditable={false}
            className={cn(
              "shadow-sm flex h-7 w-7 items-center justify-center rounded-md border border-subtle bg-layer-1 text-tertiary transition hover:bg-layer-2 hover:text-primary",
              {
                "bg-success-subtle text-success-primary": copied,
              }
            )}
            onClick={(e) => void copyToClipboard(e)}
          >
            {copied ? (
              <CheckIcon className="text-emerald-500 h-3.5 w-3.5" strokeWidth={3} />
            ) : (
              <CopyIcon className="h-3.5 w-3.5" />
            )}
          </button>
        </Tooltip>
      </div>

      <pre className="font-mono text-sm rounded-xl border border-subtle bg-layer-3 p-4 pt-8 text-primary">
        <NodeViewContent as="code" className="whitespace-pre-wrap" />
      </pre>
    </NodeViewWrapper>
  );
}
