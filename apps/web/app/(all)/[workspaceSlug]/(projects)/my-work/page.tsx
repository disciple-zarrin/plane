/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { PageHead } from "@/components/core/page-title";
import { MyWorkAcrossWorkspaces } from "@/components/workspace/my-work/my-work-across-workspaces";

export default function MyWorkPage() {
  return (
    <>
      <PageHead title="کارهای من" />
      <MyWorkAcrossWorkspaces />
    </>
  );
}
