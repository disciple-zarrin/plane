/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import Link from "next/link";
// ui
import { Button } from "@plane/propel/button";
// layouts
import DefaultLayout from "@/layouts/default-layout";

export function NotAWorkspaceMember() {
  return (
    <DefaultLayout>
      <div className="grid h-full place-items-center p-4">
        <div className="space-y-8 text-center">
          <div className="space-y-2">
            <h3 className="text-16 font-semibold">دسترسی غیرمجاز!</h3>
            <p className="mx-auto w-1/2 text-13 text-secondary">
              شما عضو این فضای کاری نیستید. لطفاً برای دریافت دعوت‌نامه با مدیر فضای کاری تماس بگیرید یا دعوت‌نامه‌های در
              انتظار خود را بررسی کنید.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Link href="/invitations">
              <span>
                <Button variant="secondary">بررسی دعوت‌نامه‌های در انتظار</Button>
              </span>
            </Link>
            <Link href="/create-workspace">
              <span>
                <Button variant="primary">ایجاد فضای کاری جدید</Button>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
