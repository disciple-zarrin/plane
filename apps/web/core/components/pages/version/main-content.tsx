/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useState } from "react";
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
  fetchAllVersions?: (pageId: string) => Promise<TPageVersion[] | undefined>;
  handleClose: () => void;
  handleRestore: (descriptionHTML: string, versionId?: string) => Promise<void>;
  pageId: string;
  restoreEnabled: boolean;
  storeType: EPageStoreType;
};

type TDiffMode = "introduced" | "vs_current";

export const PageVersionsMainContent = observer(function PageVersionsMainContent(props: Props) {
  const {
    activeVersion,
    editorComponent,
    fetchVersionDetails,
    fetchAllVersions,
    handleClose,
    handleRestore,
    pageId,
    restoreEnabled,
    storeType,
  } = props;
  const [isRestoring, setIsRestoring] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showDiff, setShowDiff] = useState(true);
  const [diffMode, setDiffMode] = useState<TDiffMode>("introduced");
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

  const { data: versionsList } = useSWR(
    pageId && fetchAllVersions ? `PAGE_VERSIONS_LIST_FOR_DIFF_${pageId}` : null,
    pageId && fetchAllVersions ? () => fetchAllVersions(pageId) : null
  );

  // versionsList is newest-first; previous checkpoint is the next older row.
  const previousVersionMeta = useMemo(() => {
    if (!activeVersion || !versionsList?.length) return null;
    const idx = versionsList.findIndex((v) => v.id === activeVersion);
    if (idx < 0 || idx >= versionsList.length - 1) return null;
    return versionsList[idx + 1];
  }, [activeVersion, versionsList]);

  const { data: previousVersionDetails } = useSWR(
    previousVersionMeta?.id ? `PAGE_VERSION_${previousVersionMeta.id}` : null,
    previousVersionMeta?.id ? () => fetchVersionDetails(pageId, previousVersionMeta.id) : null
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

  const currentHtml = currentPage?.description_html || "<p></p>";
  const selectedHtml = versionDetails?.description_html || "<p></p>";
  const previousHtml = previousVersionDetails?.description_html || "<p></p>";

  // GitLab-like: default = what this version introduced (prev → this).
  // Fallback to vs-current when there is no older version.
  const effectiveMode: TDiffMode =
    diffMode === "introduced" && !previousVersionMeta ? "vs_current" : diffMode;

  const beforeHtml = effectiveMode === "introduced" ? previousHtml : selectedHtml;
  const afterHtml = effectiveMode === "introduced" ? selectedHtml : currentHtml;
  const caption =
    effectiveMode === "introduced"
      ? "تغییرات این نسخه نسبت به نسخهٔ قبلی (مثل GitLab)"
      : "تفاوت این نسخه با نسخهٔ فعلی سند";

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
                {showDiff ? "پیش‌نمایش سند" : "دیف ++/−−"}
              </button>
              {showDiff && (
                <div className="flex items-center gap-1 rounded-sm border border-subtle p-0.5 text-11">
                  <button
                    type="button"
                    className={
                      effectiveMode === "introduced"
                        ? "rounded-sm bg-layer-transparent-selected px-2 py-0.5"
                        : "px-2 py-0.5 text-tertiary"
                    }
                    onClick={() => setDiffMode("introduced")}
                    disabled={!previousVersionMeta}
                    title={!previousVersionMeta ? "نسخهٔ قبلی وجود ندارد" : undefined}
                  >
                    این نسخه
                  </button>
                  <button
                    type="button"
                    className={
                      effectiveMode === "vs_current"
                        ? "rounded-sm bg-layer-transparent-selected px-2 py-0.5"
                        : "px-2 py-0.5 text-tertiary"
                    }
                    onClick={() => setDiffMode("vs_current")}
                  >
                    در برابر فعلی
                  </button>
                </div>
              )}
            </div>
            {restoreEnabled && (
              <Button variant="primary" className="flex-shrink-0" onClick={handleRestoreVersion} loading={isRestoring}>
                {isRestoring ? "…" : "بازگردانی به این نسخه"}
              </Button>
            )}
          </div>
          <div className="vertical-scrollbar scrollbar-sm h-full overflow-y-scroll px-5 pt-6">
            {showDiff && versionDetails ? (
              <DocumentHtmlDiff
                beforeHtml={beforeHtml}
                afterHtml={afterHtml}
                caption={caption}
                fileName={`${currentPage?.name || "document"}.md`}
              />
            ) : (
              <VersionEditor activeVersion={activeVersion} storeType={storeType} versionDetails={versionDetails} />
            )}
          </div>
        </>
      )}
    </div>
  );
});
