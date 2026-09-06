/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ArchiveOutline, CloseOutline } from "@makeplane/propel/icons";
import { Trash2 } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TIssuePriorities } from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
import { cn } from "@plane/utils";
// dropdowns
import { PriorityDropdown } from "@/components/dropdowns/priority";
import { StateDropdown } from "@/components/dropdowns/state/dropdown";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { useMultipleSelectStore } from "@/hooks/store/use-multiple-select-store";
import type { TSelectionHelper } from "@/hooks/use-multiple-select";
// modals
import { MoveIssuesToProjectModal } from "./move-issues-to-project-modal";
import { BulkDeleteIssuesConfirmationModal } from "./bulk-delete-confirmation-modal";

type Props = {
  className?: string;
  selectionHelpers: TSelectionHelper;
};

export const IssueBulkActionBar = observer(function IssueBulkActionBar(props: Props) {
  const { className, selectionHelpers } = props;

  const { workspaceSlug: routerWorkspaceSlug, projectId: routerProjectId } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  const currentProjectId = routerProjectId?.toString();

  const { selectedEntityIds, selectedCount, clearSelection } = useMultipleSelectStore();
  const { issues, issueMap } = useIssues(EIssuesStoreType.PROJECT);
  const { t } = useTranslation();

  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  if (selectedCount === 0 || selectionHelpers.isSelectionDisabled) {
    return null;
  }

  // Handle bulk state change
  const handleBulkStateChange = async (stateId: string) => {
    if (!workspaceSlug || selectedEntityIds.length === 0) return;
    setIsUpdating(true);
    try {
      if (currentProjectId && issues.bulkUpdateProperties) {
        await issues.bulkUpdateProperties(workspaceSlug, currentProjectId, {
          issue_ids: selectedEntityIds,
          properties: { state_id: stateId },
        });
      } else {
        await Promise.all(
          selectedEntityIds.map((issueId) => {
            const issue = issueMap[issueId];
            const pId = issue?.project_id || currentProjectId;
            if (pId && issues.updateIssue) {
              return issues.updateIssue(workspaceSlug, pId, issueId, { state_id: stateId });
            }
            return Promise.resolve();
          })
        );
      }
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("common.success") || "Success",
        message:
          t("issues.bulk.state_updated", { count: selectedEntityIds.length }) ||
          "State updated for selected work items.",
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("common.error") || "Error",
        message: "Failed to update state.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle bulk priority change
  const handleBulkPriorityChange = async (priority: TIssuePriorities) => {
    if (!workspaceSlug || selectedEntityIds.length === 0) return;
    setIsUpdating(true);
    try {
      if (currentProjectId && issues.bulkUpdateProperties) {
        await issues.bulkUpdateProperties(workspaceSlug, currentProjectId, {
          issue_ids: selectedEntityIds,
          properties: { priority },
        });
      } else {
        await Promise.all(
          selectedEntityIds.map((issueId) => {
            const issue = issueMap[issueId];
            const pId = issue?.project_id || currentProjectId;
            if (pId && issues.updateIssue) {
              return issues.updateIssue(workspaceSlug, pId, issueId, { priority });
            }
            return Promise.resolve();
          })
        );
      }
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("common.success") || "Success",
        message:
          t("issues.bulk.priority_updated", { count: selectedEntityIds.length }) ||
          "Priority updated for selected work items.",
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("common.error") || "Error",
        message: "Failed to update priority.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle bulk assignee change
  const handleBulkAssigneeChange = async (assigneeIds: string[]) => {
    if (!workspaceSlug || selectedEntityIds.length === 0) return;
    setIsUpdating(true);
    try {
      if (currentProjectId && issues.bulkUpdateProperties) {
        await issues.bulkUpdateProperties(workspaceSlug, currentProjectId, {
          issue_ids: selectedEntityIds,
          properties: { assignee_ids: assigneeIds },
        });
      } else {
        await Promise.all(
          selectedEntityIds.map((issueId) => {
            const issue = issueMap[issueId];
            const pId = issue?.project_id || currentProjectId;
            if (pId && issues.updateIssue) {
              return issues.updateIssue(workspaceSlug, pId, issueId, { assignee_ids: assigneeIds });
            }
            return Promise.resolve();
          })
        );
      }
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("common.success") || "Success",
        message:
          t("issues.bulk.assignees_updated", { count: selectedEntityIds.length }) ||
          "Assignees updated for selected work items.",
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("common.error") || "Error",
        message: "Failed to update assignees.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle bulk archive
  const handleBulkArchive = async () => {
    if (!workspaceSlug || !currentProjectId || selectedEntityIds.length === 0) return;
    setIsUpdating(true);
    try {
      await Promise.all(
        selectedEntityIds.map((issueId) => {
          const issue = issueMap[issueId];
          const pId = issue?.project_id || currentProjectId;
          if (pId && issues.archiveIssue) {
            return issues.archiveIssue(workspaceSlug, pId, issueId);
          }
          return Promise.resolve();
        })
      );
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("common.success") || "Success",
        message:
          t("issues.bulk.archive_success", { count: selectedEntityIds.length }) || "Selected work items archived.",
      });
      clearSelection();
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("common.error") || "Error",
        message: "Failed to archive work items.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div
        data-bulk-action-bar="true"
        className={cn(
          "shadow-2xl fixed bottom-6 left-1/2 z-40 flex w-fit max-w-[95vw] -translate-x-1/2 items-center gap-1.5 rounded-full border border-subtle bg-surface-1/95 px-3 py-1.5 backdrop-blur-md transition-all duration-200 sm:gap-2 sm:px-4",
          className
        )}
        dir="auto"
      >
        {/* Selected Counter */}
        <div className="flex items-center gap-1 px-1 text-12 font-medium whitespace-nowrap text-primary">
          <span className="rounded-full bg-accent-primary/20 px-2 py-0.5 text-11 font-semibold text-accent-primary">
            {selectedCount}
          </span>
          <span className="hidden sm:inline">{t("issues.bulk.selected") || "selected"}</span>
        </div>

        <div className="bg-subtle h-4 w-px" />

        {/* Move to project button */}
        <button
          type="button"
          onClick={() => setIsMoveModalOpen(true)}
          disabled={isUpdating}
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-12 font-medium text-secondary transition-colors hover:bg-layer-transparent-hover hover:text-primary disabled:opacity-50"
        >
          <svg className="size-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
          <span>{t("move_to_project") || "Move"}</span>
        </button>

        {/* State Dropdown */}
        {currentProjectId && (
          <div className="flex h-6 items-center">
            <StateDropdown
              value={undefined}
              onChange={handleBulkStateChange}
              projectId={currentProjectId}
              buttonVariant="transparent-without-text"
              showTooltip
              renderByDefault
              placement="top-start"
            />
          </div>
        )}

        {/* Priority Dropdown */}
        <div className="flex h-6 items-center">
          <PriorityDropdown
            value={undefined}
            onChange={handleBulkPriorityChange}
            buttonVariant="transparent-without-text"
            showTooltip
            renderByDefault
            placement="top-start"
          />
        </div>

        {/* Assignee Dropdown */}
        {currentProjectId && (
          <div className="flex h-6 items-center">
            <MemberDropdown
              value={[]}
              onChange={handleBulkAssigneeChange}
              projectId={currentProjectId}
              multiple
              buttonVariant="transparent-without-text"
              showTooltip
              renderByDefault
              placement="top-start"
            />
          </div>
        )}

        {/* Archive Button */}
        <button
          type="button"
          onClick={handleBulkArchive}
          disabled={isUpdating}
          className="flex items-center gap-1.5 rounded-full p-1.5 text-secondary transition-colors hover:bg-layer-transparent-hover hover:text-primary disabled:opacity-50"
          title={t("archive") || "Archive"}
        >
          <ArchiveOutline className="size-3.5" />
        </button>

        {/* Delete Button */}
        <button
          type="button"
          onClick={() => setIsDeleteModalOpen(true)}
          disabled={isUpdating}
          className="flex items-center gap-1.5 rounded-full p-1.5 text-danger-primary transition-colors hover:bg-danger-primary/10 disabled:opacity-50"
          title={t("delete") || "Delete"}
        >
          <Trash2 className="size-3.5 text-danger-primary" />
        </button>

        <div className="bg-subtle h-4 w-px" />

        {/* Deselect / Close Button */}
        <button
          type="button"
          onClick={clearSelection}
          className="rounded-full p-1 text-placeholder transition-colors hover:bg-layer-transparent-hover hover:text-primary"
          title={t("common.clear_selection") || "Clear selection"}
        >
          <CloseOutline className="size-3.5" />
        </button>
      </div>

      {/* Modals */}
      <MoveIssuesToProjectModal
        isOpen={isMoveModalOpen}
        onClose={() => setIsMoveModalOpen(false)}
        issueIds={selectedEntityIds}
        sourceProjectId={currentProjectId}
      />

      <BulkDeleteIssuesConfirmationModal
        isOpen={isDeleteModalOpen}
        handleClose={() => setIsDeleteModalOpen(false)}
        issueIds={selectedEntityIds}
        projectId={currentProjectId}
      />
    </>
  );
});
