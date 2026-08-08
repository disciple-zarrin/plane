# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Helpers to build a page + descendants tree for export."""

from plane.db.models import Page

MAX_EXPORT_PAGES = 50


def collect_page_descendants(root: Page, qs) -> list[Page]:
    """BFS collect root and descendants (max MAX_EXPORT_PAGES)."""
    result: list[Page] = []
    queue = [root]
    seen = {str(root.id)}
    while queue and len(result) < MAX_EXPORT_PAGES:
        page = queue.pop(0)
        result.append(page)
        children = list(qs.filter(parent_id=page.id, archived_at__isnull=True).order_by("sort_order", "created_at"))
        for child in children:
            cid = str(child.id)
            if cid not in seen:
                seen.add(cid)
                queue.append(child)
    return result


def serialize_export_tree(root: Page, pages: list[Page]) -> dict:
    by_parent: dict[str | None, list[str]] = {}
    for p in pages:
        key = str(p.parent_id) if p.parent_id else None
        by_parent.setdefault(key, []).append(str(p.id))

    serialized = []
    for p in pages:
        pid = str(p.id)
        serialized.append(
            {
                "id": pid,
                "name": p.name or "Untitled",
                "parent": str(p.parent_id) if p.parent_id else None,
                "description_html": p.description_html or "<p></p>",
                "description_json": p.description_json or {},
                "children_ids": by_parent.get(pid, []),
                "bookmark_id": f"page_{pid.replace('-', '')}",
            }
        )

    return {
        "root": str(root.id),
        "pages": serialized,
        "truncated": len(pages) >= MAX_EXPORT_PAGES,
    }
