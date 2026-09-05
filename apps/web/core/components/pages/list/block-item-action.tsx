/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { ExportOutline, GlobeOutline, InfoOutline, LockOutline, MinusOutline } from "@makeplane/propel/icons";
// plane imports
import { Avatar } from "@makeplane/propel/components/avatar";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { FavoriteStar } from "@plane/ui";
import { renderFormattedDate, getFileURL } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { usePageOperations } from "@/hooks/use-page-operations";
// plane web hooks
import type { EPageStoreType } from "@/hooks/store";
// store
import type { TPageInstance } from "@/store/pages/base-page";
// local imports
import { PageActions } from "../dropdowns";
import { ExportPageModal } from "../modals/export-page-modal";

type Props = {
  page: TPageInstance;
  parentRef: React.RefObject<HTMLElement | null>;
  storeType: EPageStoreType;
};

export const BlockItemAction = observer(function BlockItemAction(props: Props) {
  const { page, parentRef, storeType } = props;
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const { getUserDetails } = useMember();
  const { pageOperations } = usePageOperations({
    page,
  });
  const { access, created_at, is_favorite, owned_by, canCurrentUserFavoritePage, name, id } = page;
  const ownerDetails = owned_by ? getUserDetails(owned_by) : undefined;

  const EXTRA_MENU_OPTIONS = useMemo(
    () => [
      {
        key: "export" as const,
        action: () => setIsExportModalOpen(true),
        title: "خروجی (PDF / Word / Markdown)",
        icon: ExportOutline,
        shouldRender: true,
      },
    ],
    []
  );

  return (
    <>
      <ExportPageModal
        editorRef={null}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        pageTitle={name ?? "page"}
        pageId={id}
        exportContext="project"
        isRtl={Boolean(page.view_props?.is_rtl)}
      />
      <div className="cursor-default">
        <Tooltip label={`Owned by: ${ownerDetails?.display_name ?? ""}`} layout="stacked">
          <Avatar
            alt={ownerDetails?.display_name}
            fallback={ownerDetails?.display_name?.[0]?.toUpperCase()}
            src={getFileURL(ownerDetails?.avatar_url ?? "")}
            size="xs"
          />
        </Tooltip>
      </div>
      <div className="cursor-default text-tertiary">
        <Tooltip label={access === 0 ? "Public" : "Private"}>
          {access === 0 ? <GlobeOutline className="h-4 w-4" /> : <LockOutline className="h-4 w-4" />}
        </Tooltip>
      </div>
      {/* vertical divider */}
      <MinusOutline className="-mx-3 h-5 w-5 rotate-90 text-placeholder" />

      {/* page info */}
      <Tooltip label={`Created on ${renderFormattedDate(created_at)}`} layout="stacked">
        <span className="grid h-4 w-4 cursor-default place-items-center">
          <InfoOutline className="h-4 w-4 text-tertiary" />
        </span>
      </Tooltip>

      {canCurrentUserFavoritePage && (
        <FavoriteStar
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            pageOperations.toggleFavorite();
          }}
          selected={is_favorite}
        />
      )}

      <PageActions
        extraOptions={EXTRA_MENU_OPTIONS}
        optionsOrder={[
          "open-in-new-tab",
          "copy-link",
          "export",
          "make-a-copy",
          "toggle-lock",
          "toggle-access",
          "archive-restore",
          "delete",
        ]}
        page={page}
        parentRef={parentRef}
        storeType={storeType}
      />
    </>
  );
});
