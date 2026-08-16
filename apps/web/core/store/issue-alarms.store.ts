/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/** Lightweight client cache of issue IDs with an enabled deadline alarm for the current user. */

type Listener = () => void;

let enabledIssueIds = new Set<string>();
const listeners = new Set<Listener>();

const emit = () => {
  listeners.forEach((listener) => listener());
};

export const issueAlarmsStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot(): ReadonlySet<string> {
    return enabledIssueIds;
  },
  has(issueId: string | undefined | null): boolean {
    if (!issueId) return false;
    return enabledIssueIds.has(issueId);
  },
  setEnabled(issueId: string, enabled: boolean) {
    const next = new Set(enabledIssueIds);
    if (enabled) next.add(issueId);
    else next.delete(issueId);
    enabledIssueIds = next;
    emit();
  },
  replaceAll(issueIds: Iterable<string>) {
    enabledIssueIds = new Set(issueIds);
    emit();
  },
};
