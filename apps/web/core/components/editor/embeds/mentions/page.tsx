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
  const name = getCachedPageMentionName(id) || "صفحه";

  return (
    <Link
      to={href}
      className={cn(
        "not-prose inline-flex items-center gap-1 rounded-sm bg-accent-subtle-active px-1 py-0.5 text-accent-primary no-underline hover:underline"
      )}
    >
      <FileText className="size-3" />
      <span>{name}</span>
    </Link>
  );
});
