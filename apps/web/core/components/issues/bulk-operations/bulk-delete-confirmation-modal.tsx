/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { AlertModalCore } from "@plane/ui";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { useMultipleSelectStore } from "@/hooks/store/use-multiple-select-store";
import { EIssuesStoreType } from "@plane/types";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  issueIds: string[];
  projectId?: string | null;
  onSuccess?: () => void;
};

export const BulkDeleteIssuesConfirmationModal = observer(function BulkDeleteIssuesConfirmationModal(props: Props) {
  const { isOpen, handleClose, issueIds, projectId, onSuccess } = props;

  const { workspaceSlug: routerWorkspaceSlug, projectId: routerProjectId } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  const currentProjectId = projectId || routerProjectId?.toString();

  const { issues } = useIssues(EIssuesStoreType.PROJECT);
  const { clearSelection } = useMultipleSelectStore();
  const { t } = useTranslation();

  const [isDeleting, setIsDeleting] = useState(false);

  const onClose = () => {
    if (isDeleting) return;
    handleClose();
  };

  const handleDelete = async () => {
    if (!workspaceSlug || !currentProjectId || issueIds.length === 0) return;

    setIsDeleting(true);
    try {
      await issues.removeBulkIssues(workspaceSlug, currentProjectId, issueIds);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("common.success") || "Success",
        message:
          t("issues.bulk.delete_success", { count: issueIds.length }) ||
          `${issueIds.length} work items deleted successfully.`,
      });
      clearSelection();
      onSuccess?.();
      handleClose();
    } catch (err: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("common.error") || "Error",
        message: err?.error || err?.message || "Failed to delete work items.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertModalCore
      handleClose={onClose}
      handleSubmit={handleDelete}
      isSubmitting={isDeleting}
      isOpen={isOpen}
      title={t("issues.bulk.delete_title", { count: issueIds.length }) || `Delete ${issueIds.length} work items`}
      content={
        <div dir="auto" className="text-start">
          <p className="text-13 text-secondary">
            {t("issues.bulk.delete_confirmation", { count: issueIds.length }) ||
              `Are you sure you want to delete ${issueIds.length} selected work items? This action cannot be undone.`}
          </p>
        </div>
      }
    />
  );
});
