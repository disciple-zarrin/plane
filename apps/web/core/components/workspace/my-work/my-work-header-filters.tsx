/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { Search } from "lucide-react";
import { EIssueLayoutTypes } from "@plane/types";
import { CustomSelect, Input, ToggleSwitch } from "@plane/ui";
import { FiltersDropdown, LayoutSelection } from "@/components/issues/issue-layouts/filters";
import { FilterHeader } from "@/components/issues/issue-layouts/filters/header/helpers/filter-header";
import { issueTypeToLayout, useMyWork } from "./my-work-provider";

const ALL = "__all__";

const PRIORITY_OPTIONS = [
  { key: ALL, label: "همه اولویت‌ها" },
  { key: "urgent", label: "فوری" },
  { key: "high", label: "بالا" },
  { key: "medium", label: "متوسط" },
  { key: "low", label: "پایین" },
  { key: "none", label: "بدون اولویت" },
];

export function MyWorkHeaderFilters() {
  const {
    layoutAsIssueType,
    setLayout,
    workspaceSlug,
    setWorkspaceSlug,
    projectId,
    setProjectId,
    priority,
    setPriority,
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
    <div className="relative flex items-center justify-end gap-2">
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
      <FiltersDropdown title="فیلترها" placement="bottom-end" isFiltersApplied={hasActiveFilters}>
        <div className="vertical-scrollbar scrollbar-sm relative max-h-[30rem] w-[18rem] overflow-hidden overflow-y-auto px-2.5 py-2">
          <div className="space-y-3">
            <FilterHeader
              title="جستجو و فیلتر"
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
                    placeholder="عنوان یا پروژه…"
                    className="w-full border-none bg-transparent px-0 text-13"
                  />
                </div>

                <div className="space-y-1">
                  <div className="text-caption-sm-medium text-placeholder">ورک‌اسپیس</div>
                  <CustomSelect
                    value={workspaceSlug || ALL}
                    label={
                      workspaceSlug
                        ? workspaces.find((w) => w.slug === workspaceSlug)?.name || workspaceSlug
                        : "همه ورک‌اسپیس‌ها"
                    }
                    onChange={(val: string) => setWorkspaceSlug(val === ALL ? "" : val)}
                    maxHeight="lg"
                  >
                    <CustomSelect.Option value={ALL}>همه ورک‌اسپیس‌ها</CustomSelect.Option>
                    {workspaces.map((ws) => (
                      <CustomSelect.Option key={ws.slug} value={ws.slug}>
                        {ws.name}
                      </CustomSelect.Option>
                    ))}
                  </CustomSelect>
                </div>

                <div className="space-y-1">
                  <div className="text-caption-sm-medium text-placeholder">پروژه</div>
                  <CustomSelect
                    value={projectId || ALL}
                    label={
                      projectId
                        ? (() => {
                            const p = filteredProjects.find((x) => x.id === projectId);
                            return p ? `${p.identifier} · ${p.name}` : projectId;
                          })()
                        : "همه پروژه‌ها"
                    }
                    onChange={(val: string) => setProjectId(val === ALL ? "" : val)}
                    maxHeight="lg"
                  >
                    <CustomSelect.Option value={ALL}>همه پروژه‌ها</CustomSelect.Option>
                    {filteredProjects.map((p) => (
                      <CustomSelect.Option key={p.id} value={p.id}>
                        {p.identifier} · {p.name}
                      </CustomSelect.Option>
                    ))}
                  </CustomSelect>
                </div>

                <div className="space-y-1">
                  <div className="text-caption-sm-medium text-placeholder">اولویت</div>
                  <CustomSelect
                    value={priority || ALL}
                    label={PRIORITY_OPTIONS.find((o) => o.key === (priority || ALL))?.label || "همه اولویت‌ها"}
                    onChange={(val: string) => setPriority(val === ALL ? "" : val)}
                    maxHeight="lg"
                  >
                    {PRIORITY_OPTIONS.map((o) => (
                      <CustomSelect.Option key={o.key} value={o.key}>
                        {o.label}
                      </CustomSelect.Option>
                    ))}
                  </CustomSelect>
                </div>

                <div className="flex items-center justify-between gap-2 py-1">
                  <span className="text-13 text-secondary">انجام‌شده / لغوشده</span>
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
