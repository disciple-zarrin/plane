/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { ArrowUpToLine, ChevronDown, ChevronRight, FilePlus2, FileText, Plus, Upload } from "lucide-react";
import { Link, useParams } from "react-router";
import { Button } from "@plane/propel/button";
import { WikiIcon } from "@plane/propel/icons";
import type { TPage } from "@plane/types";
import { CustomMenu } from "@plane/ui";
import { cn } from "@plane/utils";
import { PageHead } from "@/components/core/page-title";
import { HesarBackButton } from "@/components/common/hesar-back-button";
import { ExportPageModal } from "@/components/pages/modals/export-page-modal";
import { ImportMarkdownModal } from "@/components/pages/modals/import-markdown-modal";
import type { TImportDestinationOption } from "@/components/pages/modals/import-markdown-modal";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useAppRouter } from "@/hooks/use-app-router";
import { WorkspacePageService } from "@/services/page/workspace-page.service";
import { cachePageMentionName } from "@/components/editor/embeds/mentions/page-cache";

const service = new WorkspacePageService();

type TreeNode = TPage & { children: TreeNode[] };

function buildTree(pages: TPage[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  pages.forEach((p) => {
    if (p.id) {
      cachePageMentionName(p.id, p.name || "Untitled");
      map.set(p.id, { ...p, children: [] });
    }
  });
  const roots: TreeNode[] = [];
  map.forEach((node) => {
    const parentId = node.parent || null;
    if (parentId && map.has(parentId)) map.get(parentId)!.children.push(node);
    else roots.push(node);
  });
  return roots;
}

function flattenTreeOptions(nodes: TreeNode[], depth = 0): TImportDestinationOption[] {
  const out: TImportDestinationOption[] = [];
  for (const n of nodes) {
    if (!n.id) continue;
    out.push({ id: n.id, title: n.name || "بدون عنوان", depth });
    out.push(...flattenTreeOptions(n.children, depth + 1));
  }
  return out;
}

const PageTreeItem = observer(function PageTreeItem({
  node,
  depth,
  workspaceSlug,
  onExport,
}: {
  node: TreeNode;
  depth: number;
  workspaceSlug: string;
  onExport: (page: TPage) => void;
}) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children.length > 0;
  return (
    <div>
      <div
        className="group flex items-center gap-1 rounded-md px-2 py-1.5 hover:bg-layer-transparent-hover"
        style={{ paddingInlineStart: `${depth * 16 + 8}px` }}
      >
        <button
          type="button"
          className={cn("grid size-5 place-items-center rounded text-tertiary", !hasChildren && "opacity-0")}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        </button>
        <Link
          to={`/${workspaceSlug}/wiki/${node.id}`}
          className="flex min-w-0 flex-1 items-center gap-2 text-body-sm-medium text-primary"
        >
          <FileText className="size-4 shrink-0 text-tertiary" />
          <span className="truncate">{node.name || "بدون عنوان"}</span>
        </Link>
        <div
          className="opacity-0 group-hover:opacity-100 focus-within:opacity-100"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <CustomMenu placement="bottom-end" ellipsis closeOnSelect>
            <CustomMenu.MenuItem onClick={() => onExport(node)} className="flex items-center gap-2">
              <ArrowUpToLine className="size-3" />
              خروجی (PDF / Word / ZIP)
            </CustomMenu.MenuItem>
          </CustomMenu>
        </div>
      </div>
      {open &&
        node.children.map((child) => (
          <PageTreeItem
            key={child.id}
            node={child}
            depth={depth + 1}
            workspaceSlug={workspaceSlug}
            onExport={onExport}
          />
        ))}
    </div>
  );
});

export default observer(function WikiListPage() {
  const { workspaceSlug } = useParams();
  const slug = workspaceSlug?.toString() || "";
  const router = useAppRouter();
  const { currentWorkspace } = useWorkspace();
  const [pages, setPages] = useState<TPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [exportTarget, setExportTarget] = useState<TPage | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importDestinationId, setImportDestinationId] = useState<string>("");

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const data = await service.fetchAll(slug, { root_only: "0" });
      setPages(Array.isArray(data) ? data.filter((p) => !p.archived_at) : []);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const tree = useMemo(() => buildTree(pages), [pages]);
  const destinationOptions = useMemo(() => flattenTreeOptions(tree), [tree]);

  useEffect(() => {
    if (!importOpen) return;
    if (!importDestinationId && destinationOptions[0]?.id) {
      setImportDestinationId(destinationOptions[0].id);
    }
  }, [importOpen, importDestinationId, destinationOptions]);

  const createRoot = async () => {
    if (!slug || creating) return;
    setCreating(true);
    try {
      const page = await service.create(slug, { name: "صفحه جدید" });
      if (page?.id) router.push(`/${slug}/wiki/${page.id}`);
      else await load();
    } finally {
      setCreating(false);
    }
  };

  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Wiki` : "Wiki";
  const importDestinationTitle =
    destinationOptions.find((o) => o.id === importDestinationId)?.title || "بدون عنوان";

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <PageHead title={pageTitle} />
      <ExportPageModal
        editorRef={null}
        isOpen={!!exportTarget}
        onClose={() => setExportTarget(null)}
        pageTitle={exportTarget?.name || "wiki"}
        pageId={exportTarget?.id}
        exportContext="wiki"
        isRtl={Boolean(exportTarget?.view_props?.is_rtl)}
      />
      {slug && importDestinationId && (
        <ImportMarkdownModal
          isOpen={importOpen}
          onClose={() => setImportOpen(false)}
          context="wiki"
          workspaceSlug={slug}
          destinationPageId={importDestinationId}
          destinationPageTitle={importDestinationTitle}
          destinationOptions={destinationOptions}
          onDestinationChange={setImportDestinationId}
          onSuccess={async () => {
            await load();
          }}
        />
      )}
      <div className="flex items-center justify-between gap-3 border-b border-subtle px-6 py-4">
        <div className="flex items-center gap-3">
          <HesarBackButton fallbackHref={`/${slug}`} />
          <span className="flex size-9 items-center justify-center rounded-md bg-accent-primary/10 text-accent-primary">
            <WikiIcon className="size-5" />
          </span>
          <div>
            <h1 className="text-h3-medium text-primary">ویکی</h1>
            <p className="text-body-xs-regular text-tertiary">
              دانش‌نامهٔ فضای‌کار — صفحات تو‌در‌تو مثل Notion؛ با @ لینک بسازید و با / صفحه فرعی بسازید.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => {
              if (destinationOptions.length === 0) return;
              setImportOpen(true);
            }}
            disabled={destinationOptions.length === 0}
          >
            <Upload className="size-4" />
            ایمپورت ZIP
          </Button>
          <Button variant="primary" size="lg" onClick={createRoot} disabled={creating}>
            <Plus className="size-4" />
            صفحه جدید
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading && <p className="px-2 text-body-xs-regular text-tertiary">در حال بارگذاری…</p>}
        {!loading && tree.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <FilePlus2 className="size-10 text-tertiary" />
            <p className="text-body-sm-medium text-primary">هنوز صفحه‌ای نیست</p>
            <p className="max-w-sm text-body-xs-regular text-tertiary">
              اولین صفحهٔ ویکی را بسازید و مثل یک کتابچه صفحات فرعی اضافه کنید. برای ایمپورت ZIP اول یک
              صفحه بسازید.
            </p>
            <Button variant="primary" size="lg" onClick={createRoot}>
              ساخت اولین صفحه
            </Button>
          </div>
        )}
        <div className="mx-auto max-w-3xl space-y-0.5">
          {tree.map((node) => (
            <PageTreeItem key={node.id} node={node} depth={0} workspaceSlug={slug} onExport={setExportTarget} />
          ))}
        </div>
      </div>
    </div>
  );
});
