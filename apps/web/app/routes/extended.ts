/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { RouteConfigEntry } from "@react-router/dev/routes";
import { route } from "@react-router/dev/routes";

export const extendedRoutes: RouteConfigEntry[] = [
  route(":workspaceSlug/wiki", "./(all)/[workspaceSlug]/(projects)/wiki/page.tsx"),
  route(":workspaceSlug/wiki/:pageId", "./(all)/[workspaceSlug]/(projects)/wiki/[pageId]/page.tsx"),
];
