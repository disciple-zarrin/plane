/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

const pageNameCache = new Map<string, string>();

export function cachePageMentionName(id: string, name: string) {
  if (id && name) pageNameCache.set(id, name);
}

export function getCachedPageMentionName(id: string): string | undefined {
  return pageNameCache.get(id);
}
