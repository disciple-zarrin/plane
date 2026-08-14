/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Breadcrumbs, Header } from "@plane/ui";
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { MyWorkHeaderFilters } from "@/components/workspace/my-work/my-work-header-filters";
import { useMyWork } from "@/components/workspace/my-work/my-work-provider";

export function MyWorkHeader() {
  const { total, loading } = useMyWork();

  return (
    <Header>
      <Header.LeftItem>
        <Breadcrumbs>
          <Breadcrumbs.Item
            component={<BreadcrumbLink label="کارهای من" disableTooltip isLast />}
          />
        </Breadcrumbs>
        {!loading && <span className="rounded-full bg-layer-2 px-2 py-0.5 text-11 text-tertiary">{total}</span>}
      </Header.LeftItem>
      <Header.RightItem>
        <MyWorkHeaderFilters />
      </Header.RightItem>
    </Header>
  );
}
