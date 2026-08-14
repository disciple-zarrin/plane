/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export function MyWorkHeader() {
  return (
    <div className="relative z-10 flex h-header w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 bg-surface-1 p-4">
      <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
        <div>
          <div className="text-14 font-medium text-primary">کارهای من</div>
          <div className="text-11 text-tertiary">همه ورک‌اسپیس‌ها</div>
        </div>
      </div>
    </div>
  );
}
