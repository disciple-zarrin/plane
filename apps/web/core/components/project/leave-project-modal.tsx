/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { AlertTriangleIcon } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IProject } from "@plane/types";
import { Input, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";

type FormData = {
  projectName: string;
  confirmLeave: string;
};

const defaultValues: FormData = {
  projectName: "",
  confirmLeave: "",
};

export interface ILeaveProjectModal {
  project: IProject;
  isOpen: boolean;
  onClose: () => void;
}

export const LeaveProjectModal = observer(function LeaveProjectModal(props: ILeaveProjectModal) {
  const { project, isOpen, onClose } = props;
  // router
  const router = useAppRouter();
  const { workspaceSlug } = useParams();
  // store hooks
  const { t } = useTranslation();
  const { leaveProject } = useUserPermissions();

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
  } = useForm({ defaultValues });

  const handleClose = () => {
    reset({ ...defaultValues });
    onClose();
  };

  const onSubmit = async (data: any) => {
    if (!workspaceSlug) return;

    if (data) {
      if (data.projectName === project?.name) {
        const confirmVal = data.confirmLeave?.trim().toLowerCase();
        if (confirmVal === "leave project" || confirmVal === "خروج از پروژه") {
          router.push(`/${workspaceSlug}/projects`);
          return leaveProject(workspaceSlug.toString(), project.id)
            .then(() => {
              handleClose();
            })
            .catch((_err) => {
              setToast({
                type: TOAST_TYPE.ERROR,
                title: `${t("common.errors.title") || "Error"}!`,
                message: t("common.errors.unknown") || "Something went wrong please try again later.",
              });
            });
        } else {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: `${t("common.errors.title") || "Error"}!`,
            message: t("leave_project_type_confirm"),
          });
        }
      } else {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: `${t("common.errors.title") || "Error"}!`,
          message: t("leave_project_enter_name", { name: project?.name || "" }),
        });
      }
    } else {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Please fill all fields.",
      });
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XXL}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 p-6">
        <div className="flex w-full items-center justify-start gap-6">
          <span className="place-items-center rounded-full bg-danger-subtle p-4">
            <AlertTriangleIcon className="h-6 w-6 text-danger-primary" aria-hidden="true" />
          </span>
          <span className="flex items-center justify-start">
            <h3 className="text-18 font-medium 2xl:text-20">{t("leave_project_title")}</h3>
          </span>
        </div>

        <span>
          <p className="text-13 leading-7 text-secondary">
            {t("leave_project_confirmation", { name: project?.name || "" })}
          </p>
        </span>

        <div className="text-secondary">
          <p className="text-13 break-words">
            {t("leave_project_enter_name", { name: project?.name || "" })}
          </p>
          <Controller
            control={control}
            name="projectName"
            rules={{
              required: "Project name is required",
            }}
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="projectName"
                name="projectName"
                type="text"
                value={value}
                onChange={onChange}
                ref={ref}
                hasError={Boolean(errors.projectName)}
                placeholder={t("common.project_name")}
                className="mt-2 w-full"
              />
            )}
          />
        </div>

        <div className="text-secondary">
          <p className="text-13">
            {t("leave_project_type_confirm")}
          </p>
          <Controller
            control={control}
            name="confirmLeave"
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="confirmLeave"
                name="confirmLeave"
                type="text"
                value={value}
                onChange={onChange}
                ref={ref}
                hasError={Boolean(errors.confirmLeave)}
                placeholder={t("leave_project_placeholder")}
                className="mt-2 w-full"
              />
            )}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="lg" onClick={handleClose}>
            {t("cancel")}
          </Button>
          <Button variant="error-fill" size="lg" type="submit" loading={isSubmitting}>
            {isSubmitting ? t("leaving") : t("leave")}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
});
