/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Link } from "react-router";
import { FileText } from "lucide-react";
import { cn } from "@plane/utils";
import { getCachedPageMentionName } from "./page-cache";

type Props = {
  id: string;
};

export const EditorPageMention = observer(function EditorPageMention(props: Props) {
  const { id } = props;
  const { workspaceSlug, projectId } = useParams();
  const slug = workspaceSlug?.toString() || "";
  const project = projectId?.toString();
  const href = project ? `/${slug}/projects/${project}/pages/${id}` : `/${slug}/wiki/${id}`;
  const name = getCachedPageMentionName(id) || "صفحه فرعی";

  return (
    <Link
      to={href}
      contentEditable={false}
      className={cn(
        "not-prose my-0.5 inline-flex max-w-full min-w-[14rem] items-center gap-2 rounded-md px-2 py-1.5",
        "bg-surface-1 text-body-sm-medium text-primary no-underline",
        "hover:bg-layer-transparent-hover"
      )}
    >
      <FileText className="size-4 shrink-0 text-tertiary" />
      <span className="truncate">{name}</span>
    </Link>
  );
});
