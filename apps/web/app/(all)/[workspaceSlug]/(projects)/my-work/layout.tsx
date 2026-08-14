/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Outlet } from "react-router";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { MyWorkAppliedFilters } from "@/components/workspace/my-work/my-work-applied-filters";
import { MyWorkProvider } from "@/components/workspace/my-work/my-work-provider";
import { MyWorkHeader } from "./header";

export default function MyWorkLayout() {
  return (
    <MyWorkProvider>
      <AppHeader header={<MyWorkHeader />} />
      <MyWorkAppliedFilters />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </MyWorkProvider>
  );
}
