/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { X } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { EHeaderVariant, Header } from "@plane/ui";
import { useMyWork } from "./my-work-provider";

export function MyWorkAppliedFilters() {
  const { t } = useTranslation();
  const priorityLabel: Record<string, string> = {
    urgent: t("my_work_board.urgent"),
    high: t("my_work_board.high"),
    medium: t("my_work_board.medium"),
    low: t("my_work_board.low"),
    none: t("my_work_board.none_priority"),
  };

  const {
    workspaceSlug,
    projectId,
    priority,
    stateFilter,
    setStateFilter,
    searchInput,
    includeDone,
    workspaces,
    filteredProjects,
    hasActiveFilters,
    setWorkspaceSlug,
    setProjectId,
    setPriority,
    setIncludeDone,
    clearFilters,
    clearSearch,
  } = useMyWork();

  const stateLabel: Record<string, string> = {
    hide_done: t("my_work_board.hide_done"),
    started: t("my_work_board.state_started"),
    unstarted: t("my_work_board.state_unstarted"),
    completed: t("my_work_board.state_completed"),
    cancelled: t("my_work_board.state_cancelled"),
    backlog: t("my_work_board.state_backlog"),
  };

  const chips: { key: string; label: string; onClear: () => void }[] = [];
  if (searchInput.trim()) {
    chips.push({
      key: "q",
      label: `${t("my_work_board.search_prefix")}: ${searchInput.trim()}`,
      onClear: clearSearch,
    });
  }
  if (workspaceSlug) {
    chips.push({
      key: "ws",
      label: workspaces.find((w) => w.slug === workspaceSlug)?.name || workspaceSlug,
      onClear: () => setWorkspaceSlug(""),
    });
  }
  if (projectId) {
    const p = filteredProjects.find((x) => x.id === projectId);
    chips.push({
      key: "project",
      label: p ? p.identifier : t("my_work_board.project"),
      onClear: () => setProjectId(""),
    });
  }
  if (stateFilter && stateFilter !== "all" && stateFilter !== "__all__") {
    chips.push({
      key: "state",
      label: stateLabel[stateFilter] || stateFilter,
      onClear: () => setStateFilter("all"),
    });
  }
  if (priority) {
    chips.push({
      key: "priority",
      label: priorityLabel[priority] || priority,
      onClear: () => setPriority(""),
    });
  }
  if (includeDone) {
    chips.push({
      key: "done",
      label: t("my_work_board.includes_completed"),
      onClear: () => setIncludeDone(false),
    });
  }

  if (!hasActiveFilters || chips.length === 0) return null;

  return (
    <Header variant={EHeaderVariant.TERNARY}>
      <Header.LeftItem className="max-w-full gap-1.5 flex-wrap overflow-x-auto py-1">
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={chip.onClear}
            className="inline-flex items-center gap-1 rounded-sm border border-subtle bg-layer-2 px-2 py-0.5 text-11 text-secondary hover:bg-layer-2-hover shrink-0"
          >
            <span>{chip.label}</span>
            <X className="size-3" />
          </button>
        ))}
        <button type="button" onClick={clearFilters} className="px-2 py-0.5 text-11 text-accent-primary hover:underline shrink-0">
          {t("my_work_board.clear_all")}
        </button>
      </Header.LeftItem>
    </Header>
  );
}
