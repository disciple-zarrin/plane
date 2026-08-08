# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from celery import shared_task

# Django imports
from django.utils import timezone

# Module imports
from plane.db.models import Page, PageVersion
from plane.utils.exception_logger import log_exception
from plane.utils.page_version_retention import enforce_page_version_limit
from plane.utils.page_version_snapshot import decode_page_snapshot

PAGE_VERSION_TASK_TIMEOUT = 600


@shared_task
def track_page_version(page_id, existing_instance, user_id):
    """
    On content change, snapshot the *previous* page body (state before this save).

    History is a chain of past checkpoints so "diff vs current" shows additions
    with green ++. Binary/json are kept so restore does not wipe the editor.
    """
    try:
        page = Page.objects.get(id=page_id)
        old = decode_page_snapshot(existing_instance)
        old_html = old["description_html"]
        new_html = page.description_html

        if old_html == new_html:
            return

        latest = (
            PageVersion.objects.filter(page_id=page_id).order_by("-last_saved_at").first()
        )
        # Skip duplicate tip (same as last stored checkpoint).
        if latest and latest.description_html == old_html:
            return

        PageVersion.objects.create(
            page_id=page_id,
            workspace_id=page.workspace_id,
            description_json=old["description_json"],
            description_html=old_html,
            description_binary=old["description_binary"],
            description_stripped=old["description_stripped"],
            owned_by_id=user_id,
            last_saved_at=timezone.now(),
            sub_pages_data={},
        )
        enforce_page_version_limit(page_id)
        return
    except Page.DoesNotExist:
        return
    except Exception as e:
        log_exception(e)
        return
