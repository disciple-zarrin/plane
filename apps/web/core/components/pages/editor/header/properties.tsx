/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState } from "react";
import { observer } from "mobx-react";
import { Clock, Globe, Lock, Star, User, ChevronDown, ChevronUp } from "lucide-react";
// plane imports
import { Avatar } from "@plane/ui";
import { calculateTimeAgoShort, getFileURL, renderFormattedDate, cn } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
// store
import type { TPageInstance } from "@/store/pages/base-page";

type Props = {
  page: TPageInstance;
  className?: string;
};

export const PagePropertiesHeader = observer(function PagePropertiesHeader(props: Props) {
  const { page, className } = props;
  const [isExpanded, setIsExpanded] = useState(false);
  const { getUserDetails } = useMember();

  const { owned_by, updated_by, access, is_locked, is_favorite, created_at, updated_at } = page;
  const creator = owned_by ? getUserDetails(owned_by) : undefined;
  const editor = updated_by ? getUserDetails(updated_by) : undefined;

  return (
    <div className={cn("text-xs mt-3 mb-2 border-b border-subtle/50 pb-2 select-none", className)}>
      <div className="flex items-center justify-between">
        {/* Quick Badges Bar */}
        <div className="flex flex-wrap items-center gap-2 text-tertiary">
          {/* Creator badge */}
          <div className="flex items-center gap-1.5 rounded-md bg-layer-2 px-2 py-0.5 font-medium text-secondary">
            <Avatar
              src={getFileURL(creator?.avatar_url ?? "")}
              name={creator?.display_name ?? "User"}
              className="size-3.5 flex-shrink-0"
              size="sm"
            />
            <span className="max-w-[120px] truncate">{creator?.display_name ?? "کاربر"}</span>
          </div>

          {/* Last updated */}
          {updated_at && (
            <div className="flex items-center gap-1 rounded-md bg-layer-2 px-2 py-0.5" title="آخرین به‌روزرسانی">
              <Clock className="size-3 text-tertiary" />
              <span>{calculateTimeAgoShort(updated_at)} پیش</span>
            </div>
          )}

          {/* Access level */}
          <div
            className={cn("flex items-center gap-1 rounded-md px-2 py-0.5 font-medium", {
              "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400": access === 0,
              "bg-layer-2 text-tertiary": access !== 0,
            })}
          >
            {access === 0 ? (
              <>
                <Globe className="size-3" />
                <span>عمومی</span>
              </>
            ) : (
              <>
                <Lock className="size-3" />
                <span>داخلی</span>
              </>
            )}
          </div>

          {/* Locked Badge */}
          {is_locked && (
            <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center gap-1 rounded-md px-2 py-0.5 font-medium">
              <Lock className="size-3" />
              <span>قفل شده</span>
            </div>
          )}

          {/* Favorite Badge */}
          {is_favorite && (
            <div className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 flex items-center gap-1 rounded-md px-2 py-0.5 font-medium">
              <Star className="fill-yellow-500 text-yellow-500 size-3" />
              <span>نشان‌شده</span>
            </div>
          )}
        </div>

        {/* Expand/Collapse details button */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-tertiary transition-colors hover:bg-layer-2 hover:text-secondary"
        >
          <span>{isExpanded ? "بستن جزئیات" : "مشخصات سند"}</span>
          {isExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        </button>
      </div>

      {/* Expanded detailed table */}
      {isExpanded && (
        <div className="text-xs mt-2.5 grid grid-cols-1 gap-2 rounded-lg border border-subtle bg-layer-1 p-3 sm:grid-cols-2">
          <div className="flex items-center justify-between border-b border-subtle/50 pb-1.5 sm:border-b-0 sm:pb-0">
            <span className="flex items-center gap-1.5 text-tertiary">
              <User className="size-3.5" />
              <span>ایجادکننده:</span>
            </span>
            <span className="font-medium text-primary">{creator?.display_name ?? "—"}</span>
          </div>

          <div className="flex items-center justify-between border-b border-subtle/50 pb-1.5 sm:border-b-0 sm:pb-0">
            <span className="flex items-center gap-1.5 text-tertiary">
              <Clock className="size-3.5" />
              <span>تاریخ ایجاد:</span>
            </span>
            <span className="font-medium text-primary">{created_at ? renderFormattedDate(created_at) : "—"}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-tertiary">
              <User className="size-3.5" />
              <span>آخرین ویرایشگر:</span>
            </span>
            <span className="font-medium text-primary">{editor?.display_name ?? creator?.display_name ?? "—"}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-tertiary">
              <Clock className="size-3.5" />
              <span>زمان ویرایش:</span>
            </span>
            <span className="font-medium text-primary">
              {updated_at ? calculateTimeAgoShort(updated_at) + " پیش" : "—"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});
