/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { isPersianLocale } from "@plane/utils";
// local imports
import { coreSidebarMenuLinks } from "./core";
import type { TSidebarMenuItem } from "./types";

const FA_SIDEBAR_MENU: Record<string, { name: string; description: string }> = {
  "/general/": {
    name: "عمومی",
    description: "شناسایی سامانه و دریافت اطلاعات کلیدی.",
  },
  "/email/": {
    name: "ایمیل",
    description: "پیکربندی تنظیمات ارسال ایمیل و SMTP.",
  },
  "/authentication/": {
    name: "احراز هویت",
    description: "پیکربندی روش‌های ورود و احراز هویت.",
  },
  "/workspace/": {
    name: "فضاهای کاری",
    description: "مدیریت تمامی فضاهای کاری سامانه.",
  },
  "/ai/": {
    name: "هوش مصنوعی",
    description: "پیکربندی مشخصات هوش مصنوعی.",
  },
  "/image/": {
    name: "تصاویر در سامانه",
    description: "مجوز کتابخانه‌های تصویر شخص ثالث.",
  },
};

export function useSidebarMenu(): TSidebarMenuItem[] {
  const items = [
    coreSidebarMenuLinks.general,
    coreSidebarMenuLinks.email,
    coreSidebarMenuLinks.authentication,
    coreSidebarMenuLinks.workspace,
    coreSidebarMenuLinks.ai,
    coreSidebarMenuLinks.image,
  ];

  if (isPersianLocale()) {
    return items.map((item) => {
      const fa = FA_SIDEBAR_MENU[item.href];
      if (!fa) return item;
      return {
        ...item,
        name: fa.name,
        description: fa.description,
      };
    });
  }

  return items;
}
