# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Helpers to build a page + descendants tree for export."""

from __future__ import annotations

import re
from uuid import UUID

from plane.db.models import Page

MAX_EXPORT_PAGES = 50

# TipTap serializes page mentions as <mention-component ... entity_identifier="uuid" ...>
_MENTION_ID_RE = re.compile(
    r"<mention-component[^>]*?(?:entity_identifier|id)=[\"']([0-9a-fA-F-]{36})[\"'][^>]*?>",
    re.IGNORECASE,
)


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


def _extract_mentioned_page_ids(html: str | None) -> set[str]:
    if not html:
        return set()
    ids: set[str] = set()
    for match in _MENTION_ID_RE.finditer(html):
        raw = match.group(1)
        try:
            ids.add(str(UUID(raw)))
        except ValueError:
            continue
    return ids


def collect_mentioned_pages(pages: list[Page], qs, limit: int = MAX_EXPORT_PAGES) -> list[Page]:
    """
    Pull pages referenced via mention-component that are not already in the tree.
    Needed so PDF/DOCX internal links resolve to real bookmarks.
    """
    seen = {str(p.id) for p in pages}
    mentioned: set[str] = set()
    for page in pages:
        mentioned |= _extract_mentioned_page_ids(page.description_html)

    missing = [mid for mid in mentioned if mid not in seen]
    if not missing:
        return pages

    room = max(0, limit - len(pages))
    if room <= 0:
        return pages

    extras = list(qs.filter(id__in=missing[:room], archived_at__isnull=True))
    # Preserve original order, append extras
    return [*pages, *extras]


def serialize_export_tree(root: Page, pages: list[Page]) -> dict:
    page_ids = {str(p.id) for p in pages}
    by_parent: dict[str | None, list[str]] = {}
    for p in pages:
        if p.parent_id and str(p.parent_id) in page_ids:
            by_parent.setdefault(str(p.parent_id), []).append(str(p.id))

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
                "is_rtl": bool((p.view_props or {}).get("is_rtl")),
            }
        )

    return {
        "root": str(root.id),
        "pages": serialized,
        "truncated": len(pages) >= MAX_EXPORT_PAGES,
    }
