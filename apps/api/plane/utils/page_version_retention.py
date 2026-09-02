# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Helpers for page/wiki version retention limits."""

from plane.db.models import Page, PageVersion, Workspace

DEFAULT_PAGE_VERSION_LIMIT = 20


def get_page_version_limit_for_page(page_id) -> int:
    """
    Return max versions to keep for a page.
    0 means unlimited (keep all).
    """
    workspace_id = Page.objects.filter(id=page_id).values_list("workspace_id", flat=True).first()
    if not workspace_id:
        return DEFAULT_PAGE_VERSION_LIMIT
    limit = (
        Workspace.objects.filter(id=workspace_id).values_list("page_version_limit", flat=True).first()
    )
    if limit is None:
        return DEFAULT_PAGE_VERSION_LIMIT
    return int(limit)


def enforce_page_version_limit(page_id) -> None:
    """Delete oldest versions when over the workspace retention limit."""
    limit = get_page_version_limit_for_page(page_id)
    if limit <= 0:
        return
    qs = PageVersion.objects.filter(page_id=page_id).order_by("last_saved_at")
    overflow = qs.count() - limit
    if overflow <= 0:
        return
    ids = list(qs.values_list("id", flat=True)[:overflow])
    if ids:
        PageVersion.objects.filter(id__in=ids).delete()
