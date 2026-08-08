/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { History } from "lucide-react";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TPageVersion } from "@plane/types";
import { calculateTimeAgo, cn } from "@plane/utils";
import { DocumentHtmlDiff } from "@/components/document-versions/html-diff";
import { WorkspacePageVersionService } from "@/services/page/workspace-page-version.service";

const versionService = new WorkspacePageVersionService();

type Props = {
  workspaceSlug: string;
  pageId: string;
  currentHtml: string;
  onRestore: (html: string) => void | Promise<void>;
};

export const WikiVersionPanel = observer(function WikiVersionPanel(props: Props) {
  const { workspaceSlug, pageId, currentHtml, onRestore } = props;
  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState<TPageVersion[]>([]);
  const [active, setActive] = useState<TPageVersion | null>(null);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await versionService.fetchAllVersions(workspaceSlug, pageId);
      setVersions(Array.isArray(list) ? list : []);
    } finally {
      setLoading(false);
    }
  }, [workspaceSlug, pageId]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const selectVersion = async (v: TPageVersion) => {
    const detail = await versionService.fetchVersionById(workspaceSlug, pageId, v.id);
    setActive(detail);
  };

  const restore = async () => {
    if (!active?.id) return;
    setRestoring(true);
    try {
      const res = await versionService.restoreVersion(workspaceSlug, pageId, active.id);
      await onRestore(res?.description_html || active.description_html || "<p></p>");
      setToast({ type: TOAST_TYPE.SUCCESS, title: "بازگردانی شد" });
      setOpen(false);
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "بازگردانی ناموفق" });
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div>
      <Button variant="secondary" size="sm" onClick={() => setOpen((v) => !v)}>
        <History className="size-3.5" />
        نسخه‌ها
      </Button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex justify-end bg-black/30"
          onClick={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
        >
          <div
            role="document"
            className="flex h-full w-full max-w-lg flex-col border-l border-subtle bg-surface-1 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-subtle px-4 py-3">
              <h3 className="text-body-sm-semibold">تاریخچه نسخه‌ها</h3>
              <button type="button" className="text-11 text-tertiary" onClick={() => setOpen(false)}>
                بستن
              </button>
            </div>
            <div className="flex min-h-0 flex-1">
              <ul className="w-40 shrink-0 overflow-y-auto border-e border-subtle p-2">
                {loading && <li className="px-2 py-1 text-11 text-tertiary">…</li>}
                {versions.map((v) => (
                  <li key={v.id}>
                    <button
                      type="button"
                      onClick={() => void selectVersion(v)}
                      className={cn(
                        "w-full rounded-md px-2 py-2 text-start text-11 hover:bg-layer-transparent-hover",
                        active?.id === v.id && "bg-layer-transparent-selected"
                      )}
                    >
                      {calculateTimeAgo(v.last_saved_at)}
                    </button>
                  </li>
                ))}
                {!loading && versions.length === 0 && (
                  <li className="px-2 py-1 text-11 text-tertiary">هنوز نسخه‌ای نیست</li>
                )}
              </ul>
              <div className="min-w-0 flex-1 overflow-y-auto p-3">
                {active ? (
                  <div className="space-y-3">
                    <DocumentHtmlDiff beforeHtml={active.description_html || ""} afterHtml={currentHtml} />
                    <Button variant="primary" size="sm" loading={restoring} onClick={() => void restore()}>
                      بازگردانی به این نسخه
                    </Button>
                  </div>
                ) : (
                  <p className="text-11 text-tertiary">یک نسخه را انتخاب کنید</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
