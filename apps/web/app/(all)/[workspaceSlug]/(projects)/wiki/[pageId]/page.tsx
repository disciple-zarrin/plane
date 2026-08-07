/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import { ArrowRight, FilePlus2, FileText, Plus } from "lucide-react";
import { Link, useParams } from "react-router";
import type { EditorRefApi, IEditorPropsExtended } from "@plane/editor";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TPage, TSearchEntityRequestPayload } from "@plane/types";
import { EFileAssetType } from "@plane/types";
import { cn } from "@plane/utils";
import { LogoSpinner } from "@/components/common/logo-spinner";
import { PageHead } from "@/components/core/page-title";
import { DocumentEditor } from "@/components/editor/document/editor";
import { cachePageMentionName } from "@/components/editor/embeds/mentions/page-cache";
import { registerSubpageCreateHandler } from "@/components/pages/subpage-create-bridge";
import { useEditorAsset } from "@/hooks/store/use-editor-asset";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useAppRouter } from "@/hooks/use-app-router";
import { WorkspacePageService } from "@/services/page/workspace-page.service";
import { WorkspaceService } from "@/services/workspace.service";

const pageService = new WorkspacePageService();
const workspaceService = new WorkspaceService();

declare global {
  interface Window {
    __planeCreateSubpage?: () => void;
  }
}

export default observer(function WikiDetailPage() {
  const { workspaceSlug, pageId } = useParams();
  const slug = workspaceSlug?.toString() || "";
  const id = pageId?.toString() || "";
  const router = useAppRouter();
  const { currentWorkspace } = useWorkspace();
  const { uploadEditorAsset, duplicateEditorAsset } = useEditorAsset();
  const editorRef = useRef<EditorRefApi>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const creatingRef = useRef(false);

  const [page, setPage] = useState<TPage | null>(null);
  const [children, setChildren] = useState<TPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [initialHtml, setInitialHtml] = useState("<p></p>");

  const load = useCallback(async () => {
    if (!slug || !id) return;
    setLoading(true);
    try {
      const [detail, kids] = await Promise.all([
        pageService.fetchById(slug, id),
        pageService.fetchAll(slug, { parent: id }),
      ]);
      setPage(detail);
      setTitle(detail?.name || "");
      setInitialHtml(detail?.description_html || "<p></p>");
      if (detail?.id) cachePageMentionName(detail.id, detail.name || "Untitled");
      setChildren(Array.isArray(kids) ? kids.filter((p) => !p.archived_at) : []);
      kids?.forEach((p) => p.id && cachePageMentionName(p.id, p.name || "Untitled"));
    } finally {
      setLoading(false);
    }
  }, [slug, id]);

  useEffect(() => {
    load();
  }, [load]);

  const saveTitle = async (value: string) => {
    if (!slug || !id) return;
    setTitle(value);
    await pageService.update(slug, id, { name: value });
    cachePageMentionName(id, value || "Untitled");
  };

  const scheduleSaveContent = (json: object, nextHtml: string) => {
    if (!slug || !id) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      try {
        await pageService.updateDescription(slug, id, {
          description_html: nextHtml,
          description_json: json,
        });
      } finally {
        setSaving(false);
      }
    }, 700);
  };

  const createChild = useCallback(
    async (opts?: { open?: boolean }) => {
      if (!slug || !id) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "خطا",
          message: "صفحه والد پیدا نشد. صفحه را دوباره باز کنید.",
        });
        return;
      }
      if (creatingRef.current) return;
      creatingRef.current = true;
      setCreating(true);
      try {
        const child = await pageService.create(slug, {
          name: "صفحه فرعی",
          parent: id,
        });
        if (!child?.id) {
          throw new Error("empty");
        }
        cachePageMentionName(child.id, child.name || "صفحه فرعی");
        const mentionHtml = `<p><mention-component id="${child.id}" entity_identifier="${child.id}" entity_name="page"></mention-component></p>`;
        try {
          editorRef.current?.insertText(mentionHtml);
        } catch {
          /* optional */
        }
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "ساخته شد",
          message: "صفحه فرعی اضافه شد.",
        });
        if (opts?.open !== false) {
          router.push(`/${slug}/wiki/${child.id}`);
        } else {
          await load();
        }
      } catch (error: unknown) {
        const message =
          error && typeof error === "object" && "error" in error
            ? String((error as { error?: string }).error)
            : "ساخت صفحه فرعی انجام نشد.";
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "خطا",
          message,
        });
      } finally {
        creatingRef.current = false;
        setCreating(false);
      }
    },
    [slug, id, router, load]
  );

  const createChildRef = useRef(createChild);
  createChildRef.current = createChild;

  // Register slash-command bridge (window + module + events)
  useEffect(() => {
    const run = () => {
      void createChildRef.current({ open: true });
    };
    window.__planeCreateSubpage = run;
    const unregister = registerSubpageCreateHandler(run);
    window.addEventListener("plane-create-subpage", run);
    window.addEventListener("plane-wiki-create-subpage", run);
    return () => {
      if (window.__planeCreateSubpage === run) delete window.__planeCreateSubpage;
      unregister();
      window.removeEventListener("plane-create-subpage", run);
      window.removeEventListener("plane-wiki-create-subpage", run);
    };
  }, []);

  const onCreateSubpage = useCallback(() => {
    void createChildRef.current({ open: true });
  }, []);

  const extendedEditorProps = useMemo<Partial<IEditorPropsExtended>>(
    () => ({
      onCreateSubpage,
    }),
    [onCreateSubpage]
  );

  const workspaceId = currentWorkspace?.id || "";

  const searchMentionCallback = useCallback(
    async (payload: TSearchEntityRequestPayload) => workspaceService.searchEntity(slug, payload),
    [slug]
  );

  const pageTitle = useMemo(() => {
    const ws = currentWorkspace?.name || "Wiki";
    return `${ws} - ${title || "صفحه"}`;
  }, [currentWorkspace?.name, title]);

  if (loading || !page) {
    return (
      <div className="grid h-full place-items-center">
        <LogoSpinner />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <PageHead title={pageTitle} />
      <div className="flex items-center justify-between gap-3 border-b border-subtle px-4 py-2">
        <div className="flex min-w-0 items-center gap-2 text-body-xs-regular text-tertiary">
          <Link to={`/${slug}/wiki`} className="hover:text-primary">
            ویکی
          </Link>
          <ArrowRight className="size-3 rotate-180" />
          <span className="truncate text-primary">{title || "بدون عنوان"}</span>
          {saving && <span className="text-tertiary">در حال ذخیره…</span>}
        </div>
        <Button variant="secondary" size="sm" onClick={() => void createChild()} disabled={creating}>
          <Plus className="size-3.5" />
          {creating ? "…" : "صفحه فرعی"}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[720px] px-6 py-8">
          <input
            className="mb-4 w-full border-none bg-transparent text-h1-semibold text-primary outline-none placeholder:text-placeholder"
            value={title}
            placeholder="عنوان صفحه"
            onChange={(e) => setTitle(e.target.value)}
            onBlur={(e) => saveTitle(e.target.value)}
          />

          {children.length > 0 && (
            <div className="mb-6 rounded-lg border border-subtle bg-surface-1 p-3">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-body-xs-medium text-tertiary">صفحات فرعی</h3>
                <button
                  type="button"
                  className="text-11 text-accent-primary"
                  onClick={() => void createChild()}
                  disabled={creating}
                >
                  + افزودن
                </button>
              </div>
              <div className="space-y-1">
                {children.map((child) => (
                  <Link
                    key={child.id}
                    to={`/${slug}/wiki/${child.id}`}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-body-xs-medium text-primary hover:bg-layer-transparent-hover"
                  >
                    <FileText className="size-3.5 text-tertiary" />
                    <span className="truncate">{child.name || "بدون عنوان"}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {children.length === 0 && (
            <button
              type="button"
              onClick={() => void createChild()}
              disabled={creating}
              className={cn(
                "mb-6 flex w-full items-center gap-2 rounded-lg border border-dashed border-subtle px-3 py-2.5",
                "text-body-xs-regular text-tertiary hover:border-accent-primary/40 hover:text-accent-primary"
              )}
            >
              <FilePlus2 className="size-4" />
              افزودن صفحه فرعی — یا در ادیتور / بزن و «صفحه فرعی» را انتخاب کن
            </button>
          )}

          {workspaceId && (
            <DocumentEditor
              key={id}
              ref={editorRef}
              id={id}
              editable
              value={initialHtml}
              workspaceSlug={slug}
              workspaceId={workspaceId}
              extendedEditorProps={extendedEditorProps}
              onChange={(json, nextHtml) => {
                scheduleSaveContent(json, nextHtml);
              }}
              searchMentionCallback={searchMentionCallback}
              uploadFile={async (blockId, file) => {
                const { asset_id } = await uploadEditorAsset({
                  blockId,
                  data: {
                    entity_identifier: id,
                    entity_type: EFileAssetType.PAGE_DESCRIPTION,
                  },
                  file,
                  workspaceSlug: slug,
                });
                return asset_id;
              }}
              duplicateFile={async (assetId: string) => {
                const { asset_id } = await duplicateEditorAsset({
                  assetId,
                  entityId: id,
                  entityType: EFileAssetType.PAGE_DESCRIPTION,
                  workspaceSlug: slug,
                });
                return asset_id;
              }}
              placeholder="بنویسید… با @ لینک صفحه، با / صفحه فرعی"
            />
          )}
        </div>
      </div>
    </div>
  );
});
