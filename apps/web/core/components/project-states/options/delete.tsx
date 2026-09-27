/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Loader } from "lucide-react";
import { CloseIcon } from "@plane/propel/icons";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import type { IState, TStateOperationsCallbacks } from "@plane/types";
import { AlertModalCore } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";

type TStateDelete = {
  totalStates: number;
  state: IState;
  deleteStateCallback: TStateOperationsCallbacks["deleteState"];
  shouldTrackEvents?: boolean;
};

export const StateDelete = observer(function StateDelete(props: TStateDelete) {
  const { totalStates, state, deleteStateCallback } = props;
  const { t } = useTranslation();
  // hooks
  const { isMobile } = usePlatformOS();
  // states
  const [isDeleteModal, setIsDeleteModal] = useState(false);
  const [isDelete, setIsDelete] = useState(false);
  // derived values
  const isDeleteDisabled = state.default ? true : totalStates === 1 ? true : false;

  const handleDeleteState = async () => {
    if (isDeleteDisabled) return;

    setIsDelete(true);

    try {
      await deleteStateCallback(state.id);
      setIsDelete(false);
    } catch (error) {
      const errorStatus = error as { status: number; data: { error: string } };
      if (errorStatus.status === 400) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("common.error.label"),
          message: t("state_has_issues_error"),
        });
      } else {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("common.error.label"),
          message: t("entity.delete.failed", { entity: t("common.state") }),
        });
      }
      setIsDelete(false);
    }
  };

  return (
    <>
      <AlertModalCore
        handleClose={() => setIsDeleteModal(false)}
        handleSubmit={handleDeleteState}
        isSubmitting={isDelete}
        isOpen={isDeleteModal}
        title={t("entity.delete.label", { entity: t("common.state") })}
        content={t("entity.delete.confirm_simple", { entity: t("common.state"), name: state?.name || "" })}
        primaryButtonText={{
          loading: t("deleting"),
          default: t("delete"),
        }}
        secondaryButtonText={t("cancel")}
      />

      <button
        type="button"
        className={cn(
          "flex h-5 w-5 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-sm transition-colors focus:outline-none",
          isDeleteDisabled ? "bg-surface-2 text-secondary" : "text-danger-primary hover:bg-layer-1"
        )}
        disabled={isDeleteDisabled}
        onClick={() => setIsDeleteModal(true)}
      >
        <Tooltip
          tooltipContent={
            state.default ? t("state_cannot_delete_default") : totalStates === 1 ? `Cannot have an empty group.` : ``
          }
          isMobile={isMobile}
          disabled={!isDeleteDisabled}
          className="focus:outline-none"
        >
          {isDelete ? <Loader className="h-3.5 w-3.5 text-secondary" /> : <CloseIcon className="h-3.5 w-3.5" />}
        </Tooltip>
      </button>
    </>
  );
});
