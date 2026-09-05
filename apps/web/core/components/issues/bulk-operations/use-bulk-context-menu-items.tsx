/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TContextMenuItem } from "@plane/ui";
import type { TIssuePriorities } from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useMultipleSelectStore } from "@/hooks/store/use-multiple-select-store";

type Props = {
  issueIds: string[];
  projectId?: string | null;
  openMoveModal: () => void;
  openDeleteModal: () => void;
};

export const useBulkContextMenuItems = (props: Props): TContextMenuItem[] => {
  const { issueIds, projectId, openMoveModal, openDeleteModal } = props;

  const { workspaceSlug: routerWorkspaceSlug } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();

  const { projectStates } = useProjectState();
  const { issues, issueMap } = useIssues(EIssuesStoreType.PROJECT);
  const { clearSelection } = useMultipleSelectStore();
  const { t } = useTranslation();

  const count = issueIds.length;

  return useMemo(() => {
    if (count === 0) return [];

    const handleBulkState = async (stateId: string) => {
      if (!workspaceSlug) return;
      try {
        await Promise.all(
          issueIds.map((id) => {
            const issue = issueMap[id];
            const pId = issue?.project_id || projectId;
            if (pId && issues.updateIssue) {
              return issues.updateIssue(workspaceSlug, pId, id, { state_id: stateId });
            }
            return Promise.resolve();
          })
        );
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("common.success") || "Success",
          message: t("issues.bulk.state_updated", { count }) || `${count} work items updated.`,
        });
      } catch {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("common.error") || "Error",
          message: "Failed to update state.",
        });
      }
    };

    const handleBulkPriority = async (priority: TIssuePriorities) => {
      if (!workspaceSlug) return;
      try {
        await Promise.all(
          issueIds.map((id) => {
            const issue = issueMap[id];
            const pId = issue?.project_id || projectId;
            if (pId && issues.updateIssue) {
              return issues.updateIssue(workspaceSlug, pId, id, { priority });
            }
            return Promise.resolve();
          })
        );
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("common.success") || "Success",
          message: t("issues.bulk.priority_updated", { count }) || `${count} work items updated.`,
        });
      } catch {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("common.error") || "Error",
          message: "Failed to update priority.",
        });
      }
    };

    const handleBulkArchive = async () => {
      if (!workspaceSlug || !projectId) return;
      try {
        await Promise.all(
          issueIds.map((id) => {
            const issue = issueMap[id];
            const pId = issue?.project_id || projectId;
            if (pId && issues.archiveIssue) {
              return issues.archiveIssue(workspaceSlug, pId, id);
            }
            return Promise.resolve();
          })
        );
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("common.success") || "Success",
          message: t("issues.bulk.archive_success", { count }) || `${count} work items archived.`,
        });
        clearSelection();
      } catch {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("common.error") || "Error",
          message: "Failed to archive work items.",
        });
      }
    };

    // State nested menu items
    const stateMenuItems: TContextMenuItem[] = (projectStates || []).map((st) => ({
      key: `state-${st.id}`,
      title: st.name,
      action: () => handleBulkState(st.id),
      closeOnClick: true,
    }));

    // Priority nested menu items
    const priorities: { key: TIssuePriorities; label: string }[] = [
      { key: "urgent", label: t("priority.urgent") || "Urgent" },
      { key: "high", label: t("priority.high") || "High" },
      { key: "medium", label: t("priority.medium") || "Medium" },
      { key: "low", label: t("priority.low") || "Low" },
      { key: "none", label: t("priority.none") || "None" },
    ];
    const priorityMenuItems: TContextMenuItem[] = priorities.map((p) => ({
      key: `priority-${p.key}`,
      title: p.label,
      action: () => handleBulkPriority(p.key),
      closeOnClick: true,
    }));

    const items: TContextMenuItem[] = [
      {
        key: "bulk-header",
        title: `${count} ${t("issues.bulk.selected") || "items selected"}`,
        disabled: true,
        action: () => {},
      },
      {
        key: "bulk-move",
        title: t("move_to_project") || "Move to project",
        action: openMoveModal,
        closeOnClick: true,
      },
      {
        key: "bulk-state",
        title: t("issues.bulk.change_state") || "Change state",
        action: () => {},
        nestedMenuItems: stateMenuItems.length > 0 ? stateMenuItems : undefined,
      },
      {
        key: "bulk-priority",
        title: t("issues.bulk.change_priority") || "Change priority",
        action: () => {},
        nestedMenuItems: priorityMenuItems,
      },
      {
        key: "bulk-archive",
        title: t("archive") || "Archive",
        action: handleBulkArchive,
        closeOnClick: true,
      },
      {
        key: "bulk-delete",
        title: t("delete") || "Delete",
        action: openDeleteModal,
        className: "text-red-500 hover:text-red-600 focus:text-red-600",
        closeOnClick: true,
      },
    ];

    return items;
  }, [
    count,
    issueIds,
    projectId,
    workspaceSlug,
    projectStates,
    issues,
    issueMap,
    clearSelection,
    openMoveModal,
    openDeleteModal,
    t,
  ]);
};
