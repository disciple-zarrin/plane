/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { WarningTriangleOutline } from "@makeplane/propel/icons";
// Plane imports
import { Field } from "@makeplane/propel/components/field";
import { Input, InputGroup } from "@makeplane/propel/components/input";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IProject } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
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
        if (
          data.confirmLeave === "Leave Project" ||
          data.confirmLeave === "ترک پروژه" ||
          data.confirmLeave?.toLowerCase() === "leave project"
        ) {
          router.push(`/${workspaceSlug}/projects`);
          return leaveProject(workspaceSlug.toString(), project.id)
            .then(() => {
              handleClose();
            })
            .catch((_err) => {
              setToast({
                type: TOAST_TYPE.ERROR,
                title: "خطا!",
                message: "مشکلی پیش آمد، لطفاً بعداً دوباره امتحان کنید.",
              });
            });
        } else {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "خطا!",
            message: "لطفاً عبارت «ترک پروژه» را برای تأیید وارد کنید.",
          });
        }
      } else {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "خطا!",
          message: "لطفاً نام پروژه را دقیقاً همان‌طور که در توضیحات آمده وارد کنید.",
        });
      }
    } else {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "خطا!",
        message: "لطفاً تمام فیلدها را پر کنید.",
      });
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XXL}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 p-6" dir="rtl">
        <div className="flex w-full items-center justify-start gap-6">
          <span className="place-items-center rounded-full bg-danger-subtle p-4">
            <WarningTriangleOutline className="h-6 w-6 text-danger-primary" aria-hidden="true" />
          </span>
          <span className="flex items-center justify-start">
            <h3 className="text-right text-18 font-medium 2xl:text-20">ترک پروژه</h3>
          </span>
        </div>

        <span>
          <p className="text-right text-13 leading-7 text-secondary">
            آیا مطمئن هستید که می‌خواهید پروژه
            <span className="font-medium text-primary">{` «${project?.name}» `}</span> را ترک کنید؟ تمام کارهای مرتبط با
            شما غیرقابل دسترسی خواهند شد.
          </p>
        </span>

        <div className="text-right text-secondary">
          <p className="text-13 break-words">
            برای ادامه، نام پروژه <span className="font-medium text-primary">{project?.name}</span> را وارد کنید:
          </p>
          <Controller
            control={control}
            name="projectName"
            rules={{
              required: "نام پروژه الزامی است",
            }}
            render={({ field: { value, onChange, ref } }) => (
              <Field name="projectName" invalid={Boolean(errors.projectName)}>
                <InputGroup size="2xl">
                  <Input
                    size="2xl"
                    id="projectName"
                    name="projectName"
                    type="text"
                    value={value}
                    onChange={onChange}
                    ref={ref}
                    placeholder="نام پروژه را وارد کنید"
                  />
                </InputGroup>
              </Field>
            )}
          />
        </div>

        <div className="text-right text-secondary">
          <p className="text-13">
            برای تأیید، عبارت <span className="font-medium text-primary">ترک پروژه</span> را در زیر تایپ کنید:
          </p>
          <Controller
            control={control}
            name="confirmLeave"
            render={({ field: { value, onChange, ref } }) => (
              <Field name="confirmLeave" invalid={Boolean(errors.confirmLeave)}>
                <InputGroup size="2xl">
                  <Input
                    size="2xl"
                    id="confirmLeave"
                    name="confirmLeave"
                    type="text"
                    value={value}
                    onChange={onChange}
                    ref={ref}
                    placeholder="عبارت 'ترک پروژه' یا 'Leave Project' را وارد کنید"
                  />
                </InputGroup>
              </Field>
            )}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="lg" onClick={handleClose}>
            انصراف
          </Button>
          <Button variant="error-fill" size="lg" type="submit" loading={isSubmitting}>
            {isSubmitting ? "در حال خروج..." : "ترک پروژه"}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
});
