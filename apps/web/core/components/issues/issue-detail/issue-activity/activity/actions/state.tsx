/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { getStateDisplayName, isPersianLocale } from "@plane/utils";
// hooks
import { StateOutline } from "@makeplane/propel/icons";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// components
import { IssueActivityBlockComponent, IssueLink } from "./";
// icons

type TIssueStateActivity = { activityId: string; showIssue?: boolean; ends: "top" | "bottom" | undefined };

export const IssueStateActivity = observer(function IssueStateActivity(props: TIssueStateActivity) {
  const { activityId, showIssue = true, ends } = props;
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  const activity = getActivityById(activityId);

  if (!activity) return <></>;
  return (
    <IssueActivityBlockComponent
      icon={<StateOutline className="h-4 w-4 flex-shrink-0 text-secondary" />}
      activityId={activityId}
      ends={ends}
    >
      <>
        {isPersianLocale() ? (
          <>
            وضعیت را به <span className="font-medium text-primary">{getStateDisplayName(activity.new_value)}</span>{" "}
            تغییر داد
            {showIssue ? " برای " : ""}
            {showIssue && <IssueLink activityId={activityId} />}.
          </>
        ) : (
          <>
            set the state to <span className="font-medium text-primary">{activity.new_value}</span>
            {showIssue ? ` for ` : ``}
            {showIssue && <IssueLink activityId={activityId} />}.
          </>
        )}
      </>
    </IssueActivityBlockComponent>
  );
});
