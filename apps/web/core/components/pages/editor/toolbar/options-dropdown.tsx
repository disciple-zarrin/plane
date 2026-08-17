/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useState } from "react";
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
import { EPageStoreType as PageStoreType, usePageStore } from "@/hooks/store";
// store
import type { TPageInstance } from "@/store/pages/base-page";
// local imports
import { PageActions } from "../../dropdowns";
import { ExportPageModal } from "../../modals/export-page-modal";
import { ImportMarkdownModal } from "../../modals/import-markdown-modal";
import { PAGE_NAVIGATION_PANE_TABS_QUERY_PARAM } from "../../navigation-pane";

type Props = {
  page: TPageInstance;
  storeType: EPageStoreType;
};

export const PageOptionsDropdown = observer(function PageOptionsDropdown(props: Props) {
  const { page, storeType } = props;
  // states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  // navigation
  const router = useAppRouter();
  const { workspaceSlug, projectId } = useParams();
  const pageStore = usePageStore(PageStoreType.PROJECT);
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

  const slug = workspaceSlug?.toString() || "";
  const pid = projectId?.toString() || page.project_ids?.[0] || "";

  // menu items list
  const EXTRA_MENU_OPTIONS = useMemo(
    function EXTRA_MENU_OPTIONS(): React.ComponentProps<typeof PageActions>["extraOptions"] {
      return [
        {
          key: "full-screen",
          action: () => handleFullWidth(!isFullWidth),
          customContent: (
            <>
              تمام‌عرض
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
              نوار ابزار چسبان
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
              title: "موفق",
              message: "مارک‌داون در کلیپ‌بورد کپی شد.",
            });
          },
          title: "کپی مارک‌داون",
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
          title: "خروجی (PDF / Word / ZIP)",
          icon: ArrowUpToLine,
          shouldRender: true,
        },
        {
          key: "import-markdown",
          action: () => setIsImportModalOpen(true),
          title: "ایمپورت ZIP مارک‌داون",
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
    ]
  );

  return (
    <>
      <ExportPageModal
        editorRef={editorRef}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        pageTitle={name ?? ""}
        pageId={page.id}
        exportContext={storeType === PageStoreType.PROJECT ? "project" : "wiki"}
        isRtl={Boolean(page.view_props?.is_rtl)}
      />
      {page.id && slug && (
        <ImportMarkdownModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          context={storeType === PageStoreType.PROJECT ? "project" : "wiki"}
          workspaceSlug={slug}
          projectId={pid || undefined}
          destinationPageId={page.id}
          destinationPageTitle={name || "بدون عنوان"}
          onSuccess={async () => {
            if (pid) {
              await pageStore.fetchPagesList(slug, pid);
            }
          }}
        />
      )}
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
