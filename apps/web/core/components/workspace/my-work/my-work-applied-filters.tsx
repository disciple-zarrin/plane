/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { X } from "lucide-react";
import { EHeaderVariant, Header } from "@plane/ui";
import { useMyWork } from "./my-work-provider";

const PRIORITY_LABEL: Record<string, string> = {
  urgent: "فوری",
  high: "بالا",
  medium: "متوسط",
  low: "پایین",
  none: "بدون اولویت",
};

export function MyWorkAppliedFilters() {
  const {
    workspaceSlug,
    projectId,
    priority,
    searchInput,
    includeDone,
    workspaces,
    filteredProjects,
    hasActiveFilters,
    setWorkspaceSlug,
    setProjectId,
    setPriority,
    setSearchInput,
    setIncludeDone,
    clearFilters,
    clearSearch,
  } = useMyWork();

  const chips: { key: string; label: string; onClear: () => void }[] = [];
  if (searchInput.trim()) {
    chips.push({
      key: "q",
      label: `جستجو: ${searchInput.trim()}`,
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
      label: p ? p.identifier : "پروژه",
      onClear: () => setProjectId(""),
    });
  }
  if (priority) {
    chips.push({
      key: "priority",
      label: PRIORITY_LABEL[priority] || priority,
      onClear: () => setPriority(""),
    });
  }
  if (includeDone) {
    chips.push({
      key: "done",
      label: "شامل انجام‌شده",
      onClear: () => setIncludeDone(false),
    });
  }

  if (!hasActiveFilters || chips.length === 0) return null;

  return (
    <Header variant={EHeaderVariant.TERNARY}>
      <Header.LeftItem className="max-w-full gap-1.5">
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={chip.onClear}
            className="inline-flex items-center gap-1 rounded-sm border border-subtle bg-layer-2 px-2 py-1 text-11 text-secondary hover:bg-layer-2-hover"
          >
            <span>{chip.label}</span>
            <X className="size-3" />
          </button>
        ))}
        <button type="button" onClick={clearFilters} className="px-2 py-1 text-11 text-accent-primary hover:underline">
          پاک کردن همه
        </button>
      </Header.LeftItem>
    </Header>
  );
}
