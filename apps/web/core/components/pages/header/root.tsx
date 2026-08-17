/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { ArrowUpToLine, ListFilter, Upload } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TPageFilterProps, TPageNavigationTabs } from "@plane/types";
import { Button } from "@plane/propel/button";
import { Header, CustomSelect, EHeaderVariant } from "@plane/ui";
import { calculateTotalFilters } from "@plane/utils";
// components
import { FiltersDropdown } from "@/components/issues/issue-layouts/filters";
import { ExportPageModal } from "@/components/pages/modals/export-page-modal";
import { ImportMarkdownModal } from "@/components/pages/modals/import-markdown-modal";
import type { TImportDestinationOption } from "@/components/pages/modals/import-markdown-modal";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { usePageStore } from "@/hooks/store";
import type { EPageStoreType } from "@/hooks/store";
// local imports
import { PageAppliedFiltersList } from "../list/applied-filters";
import { PageFiltersSelection } from "../list/filters";
import { PageOrderByDropdown } from "../list/order-by";
import { PageSearchInput } from "../list/search-input";
import { PageTabNavigation } from "../list/tab-navigation";

type Props = {
  pageType: TPageNavigationTabs;
  projectId: string;
  storeType: EPageStoreType;
  workspaceSlug: string;
};

export const PagesListHeaderRoot = observer(function PagesListHeaderRoot(props: Props) {
  const { pageType, projectId, storeType, workspaceSlug } = props;
  const { t } = useTranslation();
  // store hooks
  const { filters, updateFilters, clearAllFilters, getCurrentProjectPageIdsByTab, getPageById, fetchPagesList } =
    usePageStore(storeType);
  const {
    workspace: { workspaceMemberIds },
  } = useMember();
  const [selectedPageId, setSelectedPageId] = useState<string>("");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const handleRemoveFilter = useCallback(
    (key: keyof TPageFilterProps, value: string | null) => {
      let newValues = filters.filters?.[key];

      if (key === "favorites") newValues = !!value;
      if (Array.isArray(newValues)) {
        if (!value) newValues = [];
        else newValues = newValues.filter((val) => val !== value);
      }

      updateFilters("filters", { [key]: newValues });
    },
    [filters.filters, updateFilters]
  );

  const isFiltersApplied = calculateTotalFilters(filters?.filters ?? {}) !== 0;
  const rootPageIds = getCurrentProjectPageIdsByTab(pageType) ?? [];
  const destinationOptions: TImportDestinationOption[] = useMemo(
    () =>
      rootPageIds
        .map((id) => {
          const page = getPageById(id);
          return page?.id ? { id: page.id, title: page.name || "بدون عنوان", depth: 0 } : null;
        })
        .filter((opt): opt is TImportDestinationOption => !!opt),
    [getPageById, rootPageIds]
  );

  useEffect(() => {
    if (!destinationOptions.length) {
      setSelectedPageId("");
      return;
    }
    if (!selectedPageId || !destinationOptions.some((opt) => opt.id === selectedPageId)) {
      setSelectedPageId(destinationOptions[0].id);
    }
  }, [destinationOptions, selectedPageId]);

  const selectedPageTitle = destinationOptions.find((opt) => opt.id === selectedPageId)?.title || "بدون عنوان";

  return (
    <>
      {selectedPageId && (
        <>
          <ExportPageModal
            editorRef={null}
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
            pageTitle={selectedPageTitle}
            pageId={selectedPageId}
            exportContext="project"
          />
          <ImportMarkdownModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            context="project"
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            destinationPageId={selectedPageId}
            destinationPageTitle={selectedPageTitle}
            destinationOptions={destinationOptions}
            onDestinationChange={setSelectedPageId}
            onSuccess={async () => {
              await fetchPagesList(workspaceSlug, projectId, pageType);
            }}
          />
        </>
      )}
      <Header variant={EHeaderVariant.SECONDARY}>
        <Header.LeftItem>
          <PageTabNavigation workspaceSlug={workspaceSlug} projectId={projectId} pageType={pageType} />
        </Header.LeftItem>
        <Header.RightItem className="items-center">
          <PageSearchInput
            searchQuery={filters.searchQuery}
            updateSearchQuery={(val) => updateFilters("searchQuery", val)}
          />
          <PageOrderByDropdown
            sortBy={filters.sortBy}
            sortKey={filters.sortKey}
            onChange={(val) => {
              if (val.key) updateFilters("sortKey", val.key);
              if (val.order) updateFilters("sortBy", val.order);
            }}
          />
          <FiltersDropdown
            icon={<ListFilter className="h-3 w-3" />}
            title={t("common.filters")}
            placement="bottom-end"
            isFiltersApplied={isFiltersApplied}
          >
            <PageFiltersSelection
              filters={filters}
              handleFiltersUpdate={updateFilters}
              memberIds={workspaceMemberIds ?? undefined}
            />
          </FiltersDropdown>
          {destinationOptions.length > 0 && (
            <>
              <CustomSelect
                label={selectedPageTitle}
                buttonClassName="border-none max-w-[180px]"
                value={selectedPageId}
                onChange={(val: string) => setSelectedPageId(val)}
                className="flex-shrink-0"
                placement="bottom-end"
              >
                {destinationOptions.map((opt) => (
                  <CustomSelect.Option key={opt.id} value={opt.id}>
                    {opt.title}
                  </CustomSelect.Option>
                ))}
              </CustomSelect>
              <Button variant="secondary" size="sm" onClick={() => setIsExportModalOpen(true)}>
                <ArrowUpToLine className="size-3.5" />
                خروجی ZIP
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setIsImportModalOpen(true)}>
                <Upload className="size-3.5" />
                ایمپورت ZIP
              </Button>
            </>
          )}
        </Header.RightItem>
      </Header>
      {calculateTotalFilters(filters?.filters ?? {}) !== 0 && (
        <Header variant={EHeaderVariant.TERNARY}>
          <PageAppliedFiltersList
            appliedFilters={filters.filters ?? {}}
            handleClearAllFilters={clearAllFilters}
            handleRemoveFilter={handleRemoveFilter}
            alwaysAllowEditing
          />
        </Header>
      )}
    </>
  );
});
