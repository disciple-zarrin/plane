/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { useAppRouter } from "@/hooks/use-app-router";
import { ArrowLeft } from "lucide-react";
import { cn } from "@plane/utils";

type Props = {
  fallbackHref?: string;
  className?: string;
  label?: string;
};

/**
 * Consistent back control: history.back() with optional fallback route.
 */
export function HesarBackButton(props: Props) {
  const { fallbackHref, className, label } = props;
  const { t } = useTranslation();
  const resolvedLabel = label ?? t("common.back");
  const router = useAppRouter();

  const onBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    if (fallbackHref) {
      router.push(fallbackHref);
    }
  };

  return (
    <button
      type="button"
      onClick={onBack}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-body-xs-medium text-secondary",
        "hover:bg-layer-transparent-hover hover:text-primary",
        className
      )}
      aria-label={resolvedLabel}
    >
      <ArrowLeft className="size-4 rtl:rotate-180" />
      <span className="hidden sm:inline">{resolvedLabel}</span>
    </button>
  );
}
