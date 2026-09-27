/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
// i18n
import { useTranslation } from "@plane/i18n";
// ui
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// hooks
import { useProjectEstimates } from "@/hooks/store/estimates";
import { useEstimate } from "@/hooks/store/estimates/use-estimate";
import { useProject } from "@/hooks/store/use-project";

type TDeleteEstimateModal = {
  workspaceSlug: string;
  projectId: string;
  estimateId: string | undefined;
  isOpen: boolean;
  handleClose: () => void;
};

export const DeleteEstimateModal = observer(function DeleteEstimateModal(props: TDeleteEstimateModal) {
  // props
  const { workspaceSlug, projectId, estimateId, isOpen, handleClose } = props;
  // hooks
  const { t } = useTranslation();
  const { areEstimateEnabledByProjectId, deleteEstimate } = useProjectEstimates();
  const { asJson: estimate } = useEstimate(estimateId);
  const { updateProject } = useProject();
  // states
  const [buttonLoader, setButtonLoader] = useState(false);

  const handleDeleteEstimate = async () => {
    try {
      if (!workspaceSlug || !projectId || !estimateId) return;
      setButtonLoader(true);
      await deleteEstimate(workspaceSlug, projectId, estimateId);
      if (areEstimateEnabledByProjectId(projectId)) {
        await updateProject(workspaceSlug, projectId, { estimate: null });
      }
      setButtonLoader(false);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("estimate_deleted_success"),
        message: t("estimate_deleted_message"),
      });
      handleClose();
    } catch (_error) {
      setButtonLoader(false);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("estimate_delete_failed"),
        message: t("estimate_delete_failed"),
      });
    }
  };

  return (
    <ModalCore isOpen={isOpen} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      <div className="relative space-y-6 py-5">
        {/* heading */}
        <div className="relative flex items-center justify-between gap-2 px-5">
          <div className="text-18 font-medium text-primary">{t("estimate_delete_title")}</div>
        </div>

        {/* estimate steps */}
        <div className="px-5">
          <div className="text-14 text-secondary">
            {t("estimate_delete_confirmation", { name: estimate?.name || "" })}
          </div>
        </div>

        <div className="relative flex items-center justify-end gap-3 border-t border-subtle px-5 pt-5">
          <Button variant="secondary" size="lg" onClick={handleClose} disabled={buttonLoader}>
            {t("cancel")}
          </Button>
          <Button variant="error-fill" size="lg" onClick={handleDeleteEstimate} disabled={buttonLoader}>
            {buttonLoader ? t("deleting") : t("entity.delete.label", { entity: t("estimate") })}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
