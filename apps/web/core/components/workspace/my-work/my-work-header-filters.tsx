/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { Search } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { EIssueLayoutTypes } from "@plane/types";
import { CustomSelect, Input, ToggleSwitch } from "@plane/ui";
import { cn } from "@plane/utils";
import { FiltersDropdown, LayoutSelection, MobileLayoutSelection } from "@/components/issues/issue-layouts/filters";
import { FilterHeader } from "@/components/issues/issue-layouts/filters/header/helpers/filter-header";
import { issueTypeToLayout, useMyWork } from "./my-work-provider";

const ALL = "__all__";

export function MyWorkHeaderFilters() {
  const { t } = useTranslation();
  const priorityOptions = [
    { key: ALL, label: t("my_work_board.all_priorities") },
    { key: "urgent", label: t("my_work_board.urgent") },
    { key: "high", label: t("my_work_board.high") },
    { key: "medium", label: t("my_work_board.medium") },
    { key: "low", label: t("my_work_board.low") },
    { key: "none", label: t("my_work_board.none_priority") },
  ];
  const stateOptions = [
    { key: ALL, label: t("my_work_board.all_states") },
    { key: "hide_done", label: t("my_work_board.hide_done") },
    { key: "started", label: t("my_work_board.state_started") },
    { key: "unstarted", label: t("my_work_board.state_unstarted") },
    { key: "completed", label: t("my_work_board.state_completed") },
    { key: "cancelled", label: t("my_work_board.state_cancelled") },
    { key: "backlog", label: t("my_work_board.state_backlog") },
  ];
  const {
    layoutAsIssueType,
    setLayout,
    workspaceSlug,
    setWorkspaceSlug,
    projectId,
    setProjectId,
    priority,
    setPriority,
    stateFilter,
    setStateFilter,
    hideDone,
    toggleHideDone,
    searchInput,
    setSearchInput,
    includeDone,
    setIncludeDone,
    workspaces,
    filteredProjects,
    hasActiveFilters,
  } = useMyWork();

  const [filtersPreview, setFiltersPreview] = useState(true);

  return (
    <div className="relative flex items-center justify-end gap-1.5 sm:gap-2">
      <div className="hidden sm:block">
        <LayoutSelection
          layouts={[
            EIssueLayoutTypes.LIST,
            EIssueLayoutTypes.KANBAN,
            EIssueLayoutTypes.CALENDAR,
            EIssueLayoutTypes.GANTT,
          ]}
          selectedLayout={layoutAsIssueType}
          onChange={(next) => {
            const mapped = issueTypeToLayout(next);
            if (mapped) setLayout(mapped);
          }}
        />
      </div>
      <div className="block sm:hidden">
        <MobileLayoutSelection
          layouts={[
            EIssueLayoutTypes.LIST,
            EIssueLayoutTypes.KANBAN,
            EIssueLayoutTypes.CALENDAR,
            EIssueLayoutTypes.GANTT,
          ]}
          activeLayout={layoutAsIssueType}
          onChange={(next) => {
            const mapped = issueTypeToLayout(next);
            if (mapped) setLayout(mapped);
          }}
        />
      </div>
      <button
        type="button"
        onClick={toggleHideDone}
        className={cn(
          "flex items-center gap-1 rounded-md border px-2 py-1 text-12 font-medium transition-colors shrink-0",
          hideDone
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
            : "border-subtle bg-surface-1 text-secondary hover:bg-surface-2 hover:text-primary"
        )}
        title={hideDone ? t("my_work_board.show_all_btn") : t("my_work_board.hide_done_btn")}
      >
        <span className="hidden sm:inline">
          {hideDone ? `✓ ${t("my_work_board.hide_done_btn")}` : t("my_work_board.hide_done_btn")}
        </span>
        <span className="inline sm:hidden text-11">
          {hideDone ? "✓ Done" : "Done"}
        </span>
      </button>
      <FiltersDropdown title={t("my_work_board.filters")} placement="bottom-end" isFiltersApplied={hasActiveFilters}>
        <div className="vertical-scrollbar scrollbar-sm relative max-h-[30rem] w-[18rem] max-w-[calc(100vw-2rem)] overflow-hidden overflow-y-auto px-2.5 py-2">
          <div className="space-y-3">
            <FilterHeader
              title={t("my_work_board.search_and_filter")}
              isPreviewEnabled={filtersPreview}
              handleIsPreviewEnabled={() => setFiltersPreview((v) => !v)}
            />
            {filtersPreview && (
              <div className="space-y-3">
                <div className="relative flex items-center gap-1.5 rounded-md border border-subtle bg-surface-1 px-2">
                  <Search className="size-3.5 text-placeholder" />
                  <Input
                    id="my-work-search"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder={t("my_work_board.search_placeholder")}
                    className="w-full border-none bg-transparent px-0 text-13"
                  />
                </div>

                <div className="space-y-1">
                  <div className="text-caption-sm-medium text-placeholder">{t("my_work_board.state_filter")}</div>
                  <CustomSelect
                    value={stateFilter || ALL}
                    label={stateOptions.find((o) => o.key === (stateFilter || ALL))?.label || t("my_work_board.all_states")}
                    onChange={(val: string) => setStateFilter(val === ALL ? "all" : val)}
                    maxHeight="lg"
                  >
                    {stateOptions.map((o) => (
                      <CustomSelect.Option key={o.key} value={o.key}>
                        {o.label}
                      </CustomSelect.Option>
                    ))}
                  </CustomSelect>
                </div>

                <div className="space-y-1">
                  <div className="text-caption-sm-medium text-placeholder">{t("my_work_board.workspace")}</div>
                  <CustomSelect
                    value={workspaceSlug || ALL}
                    label={
                      workspaceSlug
                        ? workspaces.find((w) => w.slug === workspaceSlug)?.name || workspaceSlug
                        : t("my_work_board.all_workspaces")
                    }
                    onChange={(val: string) => setWorkspaceSlug(val === ALL ? "" : val)}
                    maxHeight="lg"
                  >
                    <CustomSelect.Option value={ALL}>{t("my_work_board.all_workspaces")}</CustomSelect.Option>
                    {workspaces.map((ws) => (
                      <CustomSelect.Option key={ws.slug} value={ws.slug}>
                        {ws.name}
                      </CustomSelect.Option>
                    ))}
                  </CustomSelect>
                </div>

                <div className="space-y-1">
                  <div className="text-caption-sm-medium text-placeholder">{t("my_work_board.project")}</div>
                  <CustomSelect
                    value={projectId || ALL}
                    label={
                      projectId
                        ? (() => {
                            const p = filteredProjects.find((x) => x.id === projectId);
                            return p ? `${p.identifier} · ${p.name}` : projectId;
                          })()
                        : t("my_work_board.all_projects")
                    }
                    onChange={(val: string) => setProjectId(val === ALL ? "" : val)}
                    maxHeight="lg"
                  >
                    <CustomSelect.Option value={ALL}>{t("my_work_board.all_projects")}</CustomSelect.Option>
                    {filteredProjects.map((p) => (
                      <CustomSelect.Option key={p.id} value={p.id}>
                        {p.identifier} · {p.name}
                      </CustomSelect.Option>
                    ))}
                  </CustomSelect>
                </div>

                <div className="space-y-1">
                  <div className="text-caption-sm-medium text-placeholder">{t("my_work_board.priority")}</div>
                  <CustomSelect
                    value={priority || ALL}
                    label={priorityOptions.find((o) => o.key === (priority || ALL))?.label || t("my_work_board.all_priorities")}
                    onChange={(val: string) => setPriority(val === ALL ? "" : val)}
                    maxHeight="lg"
                  >
                    {priorityOptions.map((o) => (
                      <CustomSelect.Option key={o.key} value={o.key}>
                        {o.label}
                      </CustomSelect.Option>
                    ))}
                  </CustomSelect>
                </div>

                <div className="flex items-center justify-between gap-2 py-1">
                  <span className="text-13 text-secondary">{t("my_work_board.include_completed_cancelled")}</span>
                  <ToggleSwitch value={includeDone} onChange={setIncludeDone} />
                </div>
              </div>
            )}
          </div>
        </div>
      </FiltersDropdown>
    </div>
  );
}
