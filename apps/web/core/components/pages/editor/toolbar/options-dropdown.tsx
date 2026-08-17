/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ArrowUpToLine, Clipboard, History, Upload } from "lucide-react";
// plane imports
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { ToggleSwitch } from "@plane/ui";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
import { usePageFilters } from "@/hooks/use-page-filters";
import { useQueryParams } from "@/hooks/use-query-params";
// plane web imports
import type { TPageNavigationPaneTab } from "@/components/pages/navigation-pane/tab-panels";
import type { EPageStoreType } from "@/hooks/store";
import { EPageStoreType as PageStoreType } from "@/hooks/store";
// store
import type { TPageInstance } from "@/store/pages/base-page";
// local imports
import { importMarkdownZipToProject } from "../../export/import-markdown";
import { PageActions } from "../../dropdowns";
import { ExportPageModal } from "../../modals/export-page-modal";
import { PAGE_NAVIGATION_PANE_TABS_QUERY_PARAM } from "../../navigation-pane";

type Props = {
  page: TPageInstance;
  storeType: EPageStoreType;
};

export const PageOptionsDropdown = observer(function PageOptionsDropdown(props: Props) {
  const { page, storeType } = props;
  // states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  // navigation
  const router = useAppRouter();
  const { workspaceSlug, projectId } = useParams();
  // store values
  const {
    name,
    isContentEditable,
    editor: { editorRef },
  } = page;
  // page filters
  const { isFullWidth, handleFullWidth, isStickyToolbarEnabled, handleStickyToolbar } = usePageFilters();
  // query params
  const { updateQueryParams } = useQueryParams();

  const handleImportMarkdown = async (file: File) => {
    const slug = workspaceSlug?.toString();
    const pid = projectId?.toString() || page.project_ids?.[0];
    const pageId = page.id;
    if (!slug || !pid || !pageId) return;
    try {
      const result = await importMarkdownZipToProject({
        file,
        workspaceSlug: slug,
        projectId: pid,
        destinationPageId: pageId,
      });
      if (result.failed === 0) {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "ایمپورت شد",
          message: `${result.created} صفحه`,
        });
      } else {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "ایمپورت ناقص",
          message: `${result.created} موفق، ${result.failed} ناموفق`,
        });
      }
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "ایمپورت ناموفق" });
    }
  };

  // menu items list
  const EXTRA_MENU_OPTIONS = useMemo(
    function EXTRA_MENU_OPTIONS(): React.ComponentProps<typeof PageActions>["extraOptions"] {
      return [
        {
          key: "full-screen",
          action: () => handleFullWidth(!isFullWidth),
          customContent: (
            <>
              Full width
              <ToggleSwitch value={isFullWidth} onChange={() => {}} />
            </>
          ),
          className: "flex items-center justify-between gap-2",
        },
        {
          key: "sticky-toolbar",
          action: () => handleStickyToolbar(!isStickyToolbarEnabled),
          customContent: (
            <>
              Sticky toolbar
              <ToggleSwitch value={isStickyToolbarEnabled} onChange={() => {}} />
            </>
          ),
          className: "flex items-center justify-between gap-2",
          shouldRender: isContentEditable,
        },
        {
          key: "copy-markdown",
          action: () => {
            if (!editorRef) return;
            editorRef.copyMarkdownToClipboard();
            setToast({
              type: TOAST_TYPE.SUCCESS,
              title: "Success!",
              message: "Markdown copied to clipboard.",
            });
          },
          title: "Copy markdown",
          icon: Clipboard,
          shouldRender: true,
        },
        {
          key: "version-history",
          action: () => {
            const updatedRoute = updateQueryParams({
              paramsToAdd: {
                [PAGE_NAVIGATION_PANE_TABS_QUERY_PARAM]: "info" satisfies TPageNavigationPaneTab,
              },
            });
            router.push(updatedRoute);
          },
          title: "تاریخچه نسخه‌ها",
          icon: History,
          shouldRender: true,
        },
        {
          key: "export",
          action: () => setIsExportModalOpen(true),
          title: "خروجی (PDF / Word / Markdown)",
          icon: ArrowUpToLine,
          shouldRender: true,
        },
        {
          key: "import-markdown",
          action: () => importInputRef.current?.click(),
          title: "ایمپورت Markdown",
          icon: Upload,
          shouldRender: true,
        },
      ];
    },
    [
      handleFullWidth,
      isFullWidth,
      handleStickyToolbar,
      isStickyToolbarEnabled,
      isContentEditable,
      editorRef,
      updateQueryParams,
      router,
      setIsExportModalOpen,
    ]
  );

  return (
    <>
      <input
        ref={importInputRef}
        type="file"
        accept=".zip,application/zip"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void handleImportMarkdown(file);
        }}
      />
      <ExportPageModal
        editorRef={editorRef}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        pageTitle={name ?? ""}
        pageId={page.id}
        exportContext={storeType === PageStoreType.PROJECT ? "project" : "wiki"}
        isRtl={Boolean(page.view_props?.is_rtl)}
      />
      <PageActions
        extraOptions={EXTRA_MENU_OPTIONS}
        optionsOrder={[
          "full-screen",
          "sticky-toolbar",
          "copy-markdown",
          "version-history",
          "export",
          "import-markdown",
          "make-a-copy",
          "archive-restore",
          "delete",
          "toggle-access",
        ]}
        page={page}
        storeType={storeType}
      />
    </>
  );
});
