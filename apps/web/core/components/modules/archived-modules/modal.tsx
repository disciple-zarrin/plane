/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// hooks
import { useModule } from "@/hooks/store/use-module";
import { useAppRouter } from "@/hooks/use-app-router";

type Props = {
  workspaceSlug: string;
  projectId: string;
  moduleId: string;
  handleClose: () => void;
  isOpen: boolean;
  onSubmit?: () => Promise<void>;
};

export function ArchiveModuleModal(props: Props) {
  const { workspaceSlug, projectId, moduleId, isOpen, handleClose } = props;
  // router
  const router = useAppRouter();
  // states
  const [isArchiving, setIsArchiving] = useState(false);
  // store hooks
  const { t } = useTranslation();
  const { getModuleNameById, archiveModule } = useModule();

  const moduleName = getModuleNameById(moduleId);

  const onClose = () => {
    setIsArchiving(false);
    handleClose();
  };

  const handleArchiveModule = async () => {
    setIsArchiving(true);
    await archiveModule(workspaceSlug, projectId, moduleId)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("entity.archive.success", { entity: t("common.module") }),
          message: t("entity.archive.success", { entity: moduleName || t("common.module") }),
        });
        onClose();
        router.push(`/${workspaceSlug}/projects/${projectId}/modules`);
        return;
      })
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: `${t("common.errors.title") || "Error"}!`,
          message: t("entity.archive.failed", { entity: t("common.module") }),
        })
      )
      .finally(() => setIsArchiving(false));
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.LG}>
      <div className="px-5 py-4">
        <h3 className="text-18 font-medium 2xl:text-20">
          {t("entity.archive.title_with_name", { entity: t("common.module"), name: moduleName || "" })}
        </h3>
        <p className="mt-3 text-13 text-secondary">
          {t("entity.archive.confirm", { entity: t("common.module") })}
        </p>
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="secondary" size="lg" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button variant="primary" size="lg" tabIndex={1} onClick={handleArchiveModule} loading={isArchiving}>
            {isArchiving ? t("archiving") : t("archive")}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
}
