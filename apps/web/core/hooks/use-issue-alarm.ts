/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useSyncExternalStore } from "react";
import { issueAlarmsStore } from "@/store/issue-alarms.store";

export const useIssueHasAlarm = (issueId: string | undefined | null): boolean =>
  useSyncExternalStore(
    issueAlarmsStore.subscribe,
    () => issueAlarmsStore.has(issueId),
    () => false
  );
