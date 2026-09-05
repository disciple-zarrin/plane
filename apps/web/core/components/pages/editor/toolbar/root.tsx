/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { ArrowRightCircle } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { cn } from "@plane/utils";
// components
import { EditorRtlToggle } from "@/components/editor/rtl-toggle";
import { PageToolbar } from "@/components/pages/editor/toolbar";
// hooks
import { usePageFilters } from "@/hooks/use-page-filters";
// store
import type { TPageInstance } from "@/store/pages/base-page";

type Props = {
  handleToggleNavigationPane: () => void;
  isNavigationPaneOpen: boolean;
  page: TPageInstance;
};

export const PageEditorToolbarRoot = observer(function PageEditorToolbarRoot(props: Props) {
  const { handleToggleNavigationPane, isNavigationPaneOpen, page } = props;
  // translation
  const { t } = useTranslation();
  // derived values
  const {
    isContentEditable,
    editor: { editorRef },
  } = page;
  // page filters
  const { isFullWidth, isStickyToolbarEnabled } = usePageFilters();
  // derived values
  const shouldHideToolbar = !isStickyToolbarEnabled || !isContentEditable;
  const paneToggleLabel = isNavigationPaneOpen
    ? t("page_navigation_pane.close_button")
    : t("page_navigation_pane.open_button");

  const paneToggleButton = (
    <Tooltip label={paneToggleLabel}>
      <button
        type="button"
        className="grid size-6 shrink-0 place-items-center rounded-sm text-secondary transition-colors hover:bg-layer-transparent-hover hover:text-primary"
        onClick={handleToggleNavigationPane}
        aria-label={paneToggleLabel}
        aria-pressed={isNavigationPaneOpen}
      >
        <ArrowRightCircle className={cn("size-3.5 transition-transform", isNavigationPaneOpen ? "" : "rotate-180")} />
      </button>
    </Tooltip>
  );

  return (
    <>
      <div
        id="page-toolbar-container"
        className={cn("max-h-[52px] overflow-auto transition-all duration-300 ease-linear", {
          "max-h-0 overflow-hidden": shouldHideToolbar,
        })}
      >
        <div
          className={cn(
            "page-toolbar-content relative hidden min-h-[52px] items-center px-page-x transition-all duration-200 ease-in-out md:flex",
            {
              "wide-layout": isFullWidth,
            }
          )}
        >
          <div className="flex w-full max-w-full items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {editorRef && <PageToolbar editorRef={editorRef} />}
              {editorRef && (
                <EditorRtlToggle editorRef={editorRef} disabled={!isContentEditable} className="shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2">{paneToggleButton}</div>
          </div>
        </div>
        {/* Mobile: page-toolbar-content is md:flex only — keep direction controls visible */}
        {!shouldHideToolbar && isContentEditable && editorRef && (
          <div className="flex items-center justify-end gap-2 px-page-x py-1.5 md:hidden">
            <span className="text-11 text-tertiary">جهت پاراگراف</span>
            <EditorRtlToggle editorRef={editorRef} />
            {paneToggleButton}
          </div>
        )}
      </div>
      {/* Always-visible paragraph direction when sticky toolbar is off */}
      {shouldHideToolbar && isContentEditable && editorRef && (
        <div className="flex items-center justify-end gap-2 px-page-x py-1.5">
          <span className="text-11 text-tertiary">جهت پاراگراف</span>
          <EditorRtlToggle editorRef={editorRef} />
        </div>
      )}
      {shouldHideToolbar && (
        <div className="absolute end-0 top-0 z-10 flex h-[52px] items-center px-page-x">{paneToggleButton}</div>
      )}
    </>
  );
});
