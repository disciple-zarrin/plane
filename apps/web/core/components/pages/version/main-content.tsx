/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { EyeIcon, TriangleAlert } from "lucide-react";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TPageVersion } from "@plane/types";
import { renderFormattedDate, renderFormattedTime } from "@plane/utils";
import type { EPageStoreType } from "@/hooks/store";
import { usePageStore } from "@/hooks/store";
import { DocumentHtmlDiff } from "@/components/document-versions/html-diff";
import type { TVersionEditorProps } from "./editor";

type Props = {
  activeVersion: string | null;
  editorComponent: React.FC<TVersionEditorProps>;
  fetchVersionDetails: (pageId: string, versionId: string) => Promise<TPageVersion | undefined>;
  handleClose: () => void;
  handleRestore: (descriptionHTML: string, versionId?: string) => Promise<void>;
  pageId: string;
  restoreEnabled: boolean;
  storeType: EPageStoreType;
};

export const PageVersionsMainContent = observer(function PageVersionsMainContent(props: Props) {
  const {
    activeVersion,
    editorComponent,
    fetchVersionDetails,
    handleClose,
    handleRestore,
    pageId,
    restoreEnabled,
    storeType,
  } = props;
  const [isRestoring, setIsRestoring] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showDiff, setShowDiff] = useState(true);
  const pageStore = usePageStore(storeType);
  const currentPage = pageStore.getPageById(pageId);

  const {
    data: versionDetails,
    error: versionDetailsError,
    mutate: mutateVersionDetails,
  } = useSWR(
    pageId && activeVersion ? `PAGE_VERSION_${activeVersion}` : null,
    pageId && activeVersion ? () => fetchVersionDetails(pageId, activeVersion) : null
  );

  const handleRestoreVersion = async () => {
    if (!restoreEnabled) return;
    setIsRestoring(true);
    await handleRestore(versionDetails?.description_html ?? "<p></p>", activeVersion ?? undefined)
      .then(() => {
        setToast({ type: TOAST_TYPE.SUCCESS, title: "نسخه بازگردانی شد." });
        handleClose();
        return undefined;
      })
      .catch(() => {
        setToast({ type: TOAST_TYPE.ERROR, title: "بازگردانی ناموفق بود." });
        return undefined;
      })
      .finally(() => setIsRestoring(false));
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    await mutateVersionDetails();
    setIsRetrying(false);
  };

  const VersionEditor = editorComponent;

  return (
    <div className="flex flex-grow flex-col overflow-hidden">
      {versionDetailsError ? (
        <div className="grid flex-grow place-items-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="grid size-11 flex-shrink-0 place-items-center text-tertiary">
              <TriangleAlert className="size-10" />
            </span>
            <div>
              <h6 className="text-16 font-semibold">خطا</h6>
              <p className="text-13 text-tertiary">نسخه بارگذاری نشد.</p>
            </div>
            <Button variant="link" onClick={handleRetry} loading={isRetrying}>
              تلاش دوباره
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex min-h-14 items-center justify-between gap-2 border-b border-subtle px-5 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <h6 className="text-14 font-medium">
                {versionDetails
                  ? `${renderFormattedDate(versionDetails.last_saved_at)} ${renderFormattedTime(versionDetails.last_saved_at)}`
                  : "در حال بارگذاری…"}
              </h6>
              <span className="flex flex-shrink-0 items-center gap-1 rounded-sm bg-accent-primary/20 px-1.5 py-1 text-11 font-medium text-accent-primary">
                <EyeIcon className="size-3 flex-shrink-0" />
                فقط مشاهده
              </span>
              <button type="button" className="text-11 text-accent-primary" onClick={() => setShowDiff((v) => !v)}>
                {showDiff ? "پیش‌نمایش" : "دیف +/−"}
              </button>
            </div>
            {restoreEnabled && (
              <Button variant="primary" className="flex-shrink-0" onClick={handleRestoreVersion} loading={isRestoring}>
                {isRestoring ? "…" : "بازگردانی به این نسخه"}
              </Button>
            )}
          </div>
          <div className="vertical-scrollbar scrollbar-sm h-full overflow-y-scroll px-5 pt-6">
            {showDiff && versionDetails ? (
              <div className="space-y-2">
                <p className="text-11 text-tertiary">مقایسه این نسخه با نسخهٔ فعلی (مثل Git)</p>
                <DocumentHtmlDiff
                  beforeHtml={versionDetails.description_html || ""}
                  afterHtml={currentPage?.description_html || ""}
                />
              </div>
            ) : (
              <VersionEditor activeVersion={activeVersion} storeType={storeType} versionDetails={versionDetails} />
            )}
          </div>
        </>
      )}
    </div>
  );
});
