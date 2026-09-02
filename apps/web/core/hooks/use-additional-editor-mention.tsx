/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useMemo } from "react";
import { FileText } from "lucide-react";
import type { TMentionSection } from "@plane/editor";
import type { TPageSearchResponse, TSearchEntities, TSearchResponse } from "@plane/types";
import { useParams } from "next/navigation";
import { cachePageMentionName, getCachedPageMentionName } from "@/components/editor/embeds/mentions/page-cache";

export type TUseAdditionalEditorMentionArgs = {
  enableAdvancedMentions: boolean;
};

export type TAdditionalEditorMentionHandlerArgs = {
  response: TSearchResponse;
};

export type TAdditionalEditorMentionHandlerReturnType = {
  sections: TMentionSection[];
};

export type TAdditionalParseEditorContentArgs = {
  id: string;
  entityType: TSearchEntities;
};

export type TAdditionalParseEditorContentReturnType =
  | {
      redirectionPath: string;
      textContent: string;
    }
  | undefined;

export const useAdditionalEditorMention = (args: TUseAdditionalEditorMentionArgs) => {
  const { enableAdvancedMentions } = args;
  const { workspaceSlug, projectId } = useParams();

  const updateAdditionalSections = useCallback(
    ({ response }: TAdditionalEditorMentionHandlerArgs): TAdditionalEditorMentionHandlerReturnType => {
      if (!enableAdvancedMentions) return { sections: [] };
      const pages = response.page as TPageSearchResponse[] | undefined;
      if (!pages?.length) return { sections: [] };
      return {
        sections: [
          {
            key: "pages",
            title: "Pages",
            items: pages.map((page) => {
              const id = page.id || "";
              const title = page.name || "Untitled";
              cachePageMentionName(id, title);
              return {
                icon: <FileText className="size-3.5" />,
                id,
                entity_identifier: id,
                entity_name: "page" as const,
                title,
              };
            }),
          },
        ],
      };
    },
    [enableAdvancedMentions]
  );

  const parseAdditionalEditorContent = useCallback(
    ({ id, entityType }: TAdditionalParseEditorContentArgs): TAdditionalParseEditorContentReturnType => {
      if (entityType !== "page" && (entityType as string) !== "page_mention") return undefined;
      const slug = workspaceSlug?.toString() || "";
      // Prefer wiki route; project pages still work via wiki if is_global, else project path when projectId present
      if (projectId) {
        return {
          redirectionPath: `/${slug}/projects/${projectId}/pages/${id}`,
          textContent: getCachedPageMentionName(id) || "page",
        };
      }
      return {
        redirectionPath: `/${slug}/wiki/${id}`,
        textContent: getCachedPageMentionName(id) || "page",
      };
    },
    [workspaceSlug, projectId]
  );

  const editorMentionTypes: TSearchEntities[] = useMemo(
    () => (enableAdvancedMentions ? ["user_mention", "page"] : ["user_mention"]),
    [enableAdvancedMentions]
  );

  return {
    updateAdditionalSections,
    parseAdditionalEditorContent,
    editorMentionTypes,
  };
};
