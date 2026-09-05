/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { SearchOutline } from "@makeplane/propel/icons";
import { Check } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { ModalCore, EModalPosition, EModalWidth } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useIssues } from "@/hooks/store/use-issues";
import { useMultipleSelectStore } from "@/hooks/store/use-multiple-select-store";
import { EIssuesStoreType } from "@plane/types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  issueIds: string[];
  sourceProjectId?: string | null;
  onSuccess?: () => void;
};

export const MoveIssuesToProjectModal = observer(function MoveIssuesToProjectModal(props: Props) {
  const { isOpen, onClose, issueIds, sourceProjectId, onSuccess } = props;

  const { workspaceSlug: routerWorkspaceSlug, projectId: routerProjectId } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  const currentProjectId = sourceProjectId || routerProjectId?.toString();

  const { workspaceProjectIds, getProjectById } = useProject();
  const { issues } = useIssues(EIssuesStoreType.PROJECT);
  const { clearSelection } = useMultipleSelectStore();
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available projects in current workspace
  const availableProjects = useMemo(() => {
    if (!workspaceProjectIds) return [];
    return workspaceProjectIds
      .map((id) => getProjectById(id))
      .filter((p): p is NonNullable<typeof p> => !!p && !p.archived_at);
  }, [workspaceProjectIds, getProjectById]);

  // Filtered by user search
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return availableProjects;
    const q = searchQuery.toLowerCase().trim();
    return availableProjects.filter((p) => p.name.toLowerCase().includes(q) || p.identifier.toLowerCase().includes(q));
  }, [availableProjects, searchQuery]);

  const handleClose = () => {
    if (isSubmitting) return;
    setSearchQuery("");
    setSelectedProjectId(null);
    onClose();
  };

  const handleMove = async () => {
    if (!workspaceSlug || !selectedProjectId || issueIds.length === 0) return;

    if (selectedProjectId === currentProjectId) {
      setToast({
        type: TOAST_TYPE.WARNING,
        title: t("common.warning") || "Warning",
        message: t("issues.bulk.same_project_warning") || "Selected work items are already in this project.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (issues.moveBulkIssues) {
        await issues.moveBulkIssues(workspaceSlug, issueIds, selectedProjectId, currentProjectId);
      }
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("common.success") || "Success",
        message:
          t("issues.bulk.move_success", {
            count: issueIds.length,
          }) || `${issueIds.length} work items moved successfully.`,
      });
      clearSelection();
      onSuccess?.();
      handleClose();
    } catch (err: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("common.error") || "Error",
        message: err?.error || err?.message || "Failed to move work items.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.MD}>
      <div className="flex flex-col gap-4 p-5 text-start" dir="auto">
        <div className="flex flex-col gap-1">
          <h3 className="text-16 font-semibold text-primary">{t("move_to_project") || "Move to project"}</h3>
          <p className="text-13 text-secondary">
            {t("issues.bulk.move_description", { count: issueIds.length }) ||
              `Select destination project for ${issueIds.length} work items.`}
          </p>
        </div>

        {/* Search Input */}
        <div className="relative flex items-center rounded-md border border-subtle bg-surface-2 px-3 py-2">
          <SearchOutline className="size-4 shrink-0 text-placeholder" />
          <input
            ref={(input) => input?.focus()}
            type="text"
            className="w-full border-none bg-transparent px-2 text-13 text-primary placeholder:text-placeholder focus:outline-none"
            placeholder={t("common.search_project") || "Search project..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Projects List */}
        <div className="max-h-60 divide-y divide-subtle-1 overflow-y-auto rounded-md border border-subtle-1">
          {filteredProjects.length === 0 ? (
            <div className="p-4 text-center text-13 text-placeholder">
              {t("common.no_projects_found") || "No projects found."}
            </div>
          ) : (
            filteredProjects.map((project) => {
              const isSelected = selectedProjectId === project.id;
              const isCurrent = project.id === currentProjectId;

              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => setSelectedProjectId(project.id)}
                  disabled={isCurrent}
                  className={cn("flex w-full items-center justify-between px-3.5 py-2.5 text-start transition-colors", {
                    "bg-accent-primary/10 text-accent-primary": isSelected,
                    "cursor-not-allowed bg-layer-transparent opacity-50": isCurrent,
                    "hover:bg-layer-transparent-hover": !isSelected && !isCurrent,
                  })}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-mono shrink-0 rounded-[3px] bg-layer-2 px-1.5 py-0.5 text-11 text-secondary">
                      {project.identifier}
                    </span>
                    <span className="truncate text-13 font-medium text-primary">{project.name}</span>
                    {isCurrent && (
                      <span className="text-11 text-placeholder">({t("common.current") || "Current"})</span>
                    )}
                  </div>
                  {isSelected && <Check className="size-4 shrink-0 text-accent-primary" />}
                </button>
              );
            })
          )}
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="secondary" size="base" onClick={handleClose} disabled={isSubmitting}>
            {t("Cancel") || "Cancel"}
          </Button>
          <Button
            variant="primary"
            size="base"
            onClick={handleMove}
            disabled={!selectedProjectId || selectedProjectId === currentProjectId}
            loading={isSubmitting}
          >
            {t("move_to_project") || "Move"}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
