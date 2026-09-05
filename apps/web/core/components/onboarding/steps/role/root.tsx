/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { PenTool } from "lucide-react";
import {
  CubeOutline,
  MonitorOutline,
  RefreshOutline,
  RocketOutline,
  TickOutline,
  ViewsOutline,
} from "@makeplane/propel/icons";
// plane imports
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TUserProfile } from "@plane/types";
import { EOnboardingSteps } from "@plane/types";
import { cn } from "@plane/utils";
// hooks
import { useUserProfile } from "@/hooks/store/user";
// local components
import { CommonOnboardingHeader } from "../common";
import type { TProfileSetupFormValues } from "../profile/root";

type Props = {
  handleStepChange: (step: EOnboardingSteps, skipInvites?: boolean) => void;
};

const ROLES = [
  { id: "product-manager", label: "مدیر محصول (Product Manager)", icon: CubeOutline },
  { id: "engineering-manager", label: "مدیر مهندسی (Engineering Manager)", icon: ViewsOutline },
  { id: "designer", label: "طراح (Designer)", icon: PenTool },
  { id: "developer", label: "توسعه‌دهنده / برنامه‌نویس (Developer)", icon: MonitorOutline },
  { id: "founder-executive", label: "مؤسس / مدیر ارشد (Founder/Executive)", icon: RocketOutline },
  { id: "operations-manager", label: "مدیر عملیات (Operations Manager)", icon: RefreshOutline },
  { id: "others", label: "سایر موارد (Others)", icon: CubeOutline },
];

const defaultValues = {
  role: "",
};

export const RoleSetupStep = observer(function RoleSetupStep({ handleStepChange }: Props) {
  // store hooks
  const { data: profile, updateUserProfile } = useUserProfile();
  // form info
  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting, isValid },
  } = useForm<TProfileSetupFormValues>({
    defaultValues: {
      ...defaultValues,
      role: profile?.role,
    },
    mode: "onChange",
  });

  // handle submit
  const handleSubmitUserPersonalization = async (formData: TProfileSetupFormValues) => {
    const profileUpdatePayload: Partial<TUserProfile> = {
      role: formData.role,
    };
    try {
      [await updateUserProfile(profileUpdatePayload)];
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success",
        message: "Profile setup completed!",
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: "Profile setup failed. Please try again!",
      });
    }
  };

  const onSubmit = async (formData: TProfileSetupFormValues) => {
    if (!profile) return;
    await handleSubmitUserPersonalization(formData);
    handleStepChange(EOnboardingSteps.ROLE_SETUP);
  };

  const handleSkip = () => {
    handleStepChange(EOnboardingSteps.ROLE_SETUP);
  };

  const isButtonDisabled = !isSubmitting && isValid ? false : true;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-10" dir="rtl">
      {/* Header */}
      <CommonOnboardingHeader title="نقش شما چیست؟" description="بیایید حصار را متناسب با نحوه کار شما تنظیم کنیم." />
      {/* Role Selection */}
      <div className="flex flex-col gap-3 text-right">
        <p className="text-body-sm-semibold text-placeholder">یک مورد را انتخاب کنید</p>
        <Controller
          control={control}
          name="role"
          rules={{
            required: "این فیلد الزامی است",
          }}
          render={({ field: { value, onChange } }) => (
            <div className="flex flex-col gap-3">
              {ROLES.map((role) => {
                const Icon = role.icon;
                const isSelected = value === role.id;

                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => onChange(role.id)}
                    className={cn(
                      "flex items-center justify-between rounded-lg border p-4 text-left transition-all duration-200",
                      isSelected
                        ? "border-accent-strong bg-accent-primary/10 text-primary"
                        : "border-strong bg-surface-1 text-secondary hover:border-strong-1 hover:text-primary"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="size-5" />
                      <span className="text-14 font-medium">{role.label}</span>
                    </div>
                    {isSelected && (
                      <div className="flex size-5 items-center justify-center rounded-full bg-accent-primary text-on-color">
                        <TickOutline className="size-3 text-on-color" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        />
        {errors.role && <span className="text-13 text-danger-primary">{errors.role.message}</span>}
      </div>
      {/* Action Buttons */}
      <div className="space-y-3">
        <Button variant="primary" type="submit" className="w-full" size="xl" disabled={isButtonDisabled}>
          ادامه
        </Button>
        <Button variant="ghost" onClick={handleSkip} className="w-full text-tertiary" size="xl">
          رد شدن
        </Button>
      </div>
    </form>
  );
});
