/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useMemo } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { Breadcrumbs } from "@plane/ui";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { isPersianLocale } from "@plane/utils";

type Props = {
  label?: string;
  href?: string;
  icon?: React.ReactNode;
  disableTooltip?: boolean;
  isLast?: boolean;
};

const IconWrapper = React.memo(function IconWrapper({ icon }: { icon: React.ReactNode }) {
  return <div className="flex size-4 items-center justify-center overflow-hidden !text-16">{icon}</div>;
});

IconWrapper.displayName = "IconWrapper";

const LabelWrapper = React.memo(function LabelWrapper({ label }: { label: React.ReactNode }) {
  return <div className="relative line-clamp-1 block max-w-[150px] truncate overflow-hidden text-primary">{label}</div>;
});

LabelWrapper.displayName = "LabelWrapper";

const BreadcrumbContent = React.memo(function BreadcrumbContent({
  icon,
  label,
}: {
  icon?: React.ReactNode;
  label?: React.ReactNode;
}) {
  if (!icon && !label) return null;

  return (
    <>
      {icon && <IconWrapper icon={icon} />}
      {label && <LabelWrapper label={label} />}
    </>
  );
});

BreadcrumbContent.displayName = "BreadcrumbContent";

const ItemWrapper = React.memo(function ItemWrapper({
  children,
  ...props
}: React.ComponentProps<typeof Breadcrumbs.ItemWrapper>) {
  return <Breadcrumbs.ItemWrapper {...props}>{children}</Breadcrumbs.ItemWrapper>;
});

ItemWrapper.displayName = "ItemWrapper";

const BREADCRUMB_FA_MAP: Record<string, string> = {
  Pages: "صفحات",
  Cycles: "چرخه‌ها",
  Modules: "ماژول‌ها",
  Views: "نماها",
  Archives: "بایگانی‌ها",
  Drafts: "پیش‌نویس‌ها",
  Settings: "تنظیمات",
  Projects: "پروژه‌ها",
  Analytics: "تحلیل‌ها",
  Home: "خانه",
  Members: "اعضا",
  Billing: "صورت‌حساب",
  Integrations: "یکپارچه‌سازی‌ها",
  Webhooks: "وب‌هوک‌ها",
  Automations: "اتوماسیون‌ها",
  Labels: "برچسب‌ها",
  Estimates: "تخمین‌ها",
  States: "وضعیت‌ها",
  Features: "قابلیت‌ها",
  Exports: "خروجی‌ها",
  Imports: "ورودی‌ها",
};

export const BreadcrumbLink = observer(function BreadcrumbLink(props: Props) {
  const { href, label, icon, disableTooltip = false, isLast = false } = props;
  const { isMobile } = usePlatformOS();

  const resolvedLabel = useMemo(() => {
    if (typeof label === "string" && isPersianLocale()) {
      return BREADCRUMB_FA_MAP[label] ?? label;
    }
    return label;
  }, [label]);

  const itemWrapperProps = useMemo(
    (): Omit<React.ComponentProps<typeof ItemWrapper>, "children"> => ({
      label: resolvedLabel?.toString(),
      disableTooltip: isMobile || disableTooltip,
      type: href && href !== "" ? "link" : "text",
      isLast,
    }),
    [href, resolvedLabel, isMobile, disableTooltip, isLast]
  );

  const content = useMemo(() => <BreadcrumbContent icon={icon} label={resolvedLabel} />, [icon, resolvedLabel]);

  if (href) {
    return (
      <Link href={href}>
        <ItemWrapper {...itemWrapperProps}>{content}</ItemWrapper>
      </Link>
    );
  }

  return <ItemWrapper {...itemWrapperProps}>{content}</ItemWrapper>;
});
