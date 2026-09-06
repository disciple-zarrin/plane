/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// components
import { PageWrapper } from "@/components/common/page-wrapper";
// types
import type { Route } from "./+types/page";
import { isPersianLocale } from "@plane/utils";
// local
import { WorkspaceCreateForm } from "./form";

const WorkspaceCreatePage = observer(function WorkspaceCreatePage(_props: Route.ComponentProps) {
  return (
    <PageWrapper
      header={{
        title: isPersianLocale() ? "ایجاد فضای کاری جدید در سامانه" : "Create a new workspace on this instance.",
        description: isPersianLocale()
          ? "پس از ایجاد فضای کاری می‌توانید اعضا را از بخش تنظیمات فضای کاری دعوت نمایید."
          : "You will need to invite users from Workspace Settings after you create this workspace.",
      }}
    >
      <WorkspaceCreateForm />
    </PageWrapper>
  );
});

export const meta: Route.MetaFunction = () => [{ title: "Create Workspace - God Mode" }];

export default WorkspaceCreatePage;
