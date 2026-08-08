# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import json

# Third party imports
from celery import shared_task

# Django imports
from django.utils import timezone

# Module imports
from plane.db.models import Page, PageVersion
from plane.utils.exception_logger import log_exception
from plane.utils.page_version_retention import enforce_page_version_limit

PAGE_VERSION_TASK_TIMEOUT = 600


@shared_task
def track_page_version(page_id, existing_instance, user_id):
    """
    On content change, snapshot the *previous* HTML (state before this save).

    That way history is a chain of past states and "diff vs current" shows
    additions like سلام with green ++ — matching GitLab/user expectation.
    """
    try:
        page = Page.objects.get(id=page_id)
        current_instance = json.loads(existing_instance) if existing_instance is not None else {}
        old_html = current_instance.get("description_html")
        new_html = page.description_html

        if old_html == new_html:
            return

        latest = (
            PageVersion.objects.filter(page_id=page_id).order_by("-last_saved_at").first()
        )
        # Skip duplicate tip (same as last stored checkpoint).
        if latest and latest.description_html == (old_html or "<p></p>"):
            return

        PageVersion.objects.create(
            page_id=page_id,
            workspace_id=page.workspace_id,
            # Old binary/json is not in the task payload; HTML is enough for diffs.
            description_json={},
            description_html=old_html if old_html is not None else "<p></p>",
            description_binary=None,
            description_stripped=None,
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
