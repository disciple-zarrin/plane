/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Bell } from "lucide-react";
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/utils";
import { useIssueHasAlarm } from "@/hooks/use-issue-alarm";

type Props = {
  issueId: string | undefined | null;
  className?: string;
};

/** Blue bell on issue cards when the current user has an enabled deadline alarm. */
export function IssueAlarmBell(props: Props) {
  const { issueId, className } = props;
  const hasAlarm = useIssueHasAlarm(issueId);

  if (!hasAlarm || !issueId) return null;

  return (
    <Tooltip tooltipContent="زنگ ددلاین فعال است" position="top">
      <span
        className={cn(
          "inline-flex size-4 flex-shrink-0 items-center justify-center rounded-full bg-accent-primary/15 text-accent-primary",
          className
        )}
        aria-label="زنگ ددلاین"
      >
        <Bell className="size-2.5 fill-current" strokeWidth={2.5} />
      </span>
    </Tooltip>
  );
}
