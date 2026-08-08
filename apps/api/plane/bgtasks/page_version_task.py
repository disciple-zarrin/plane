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

PAGE_VERSION_TASK_TIMEOUT = 600  # retained for callers / docs; versions always append now

@shared_task
def track_page_version(page_id, existing_instance, user_id):
    try:
        # Get the page
        page = Page.objects.get(id=page_id)

        # Get the current instance
        current_instance = json.loads(existing_instance) if existing_instance is not None else {}
        sub_pages = {}


        # Create a version if description_html is updated
        if current_instance.get("description_html") != page.description_html:
            # Always append a new checkpoint (do not coalesce-overwrite) so history
            # keeps previous text for GitLab-style ++/-- diffs.
            PageVersion.objects.create(
                page_id=page_id,
                workspace_id=page.workspace_id,
                description_json=page.description_json or {},
                description_html=page.description_html,
                description_binary=page.description_binary,
                description_stripped=page.description_stripped,
                owned_by_id=user_id,
                last_saved_at=timezone.now(),
                sub_pages_data=sub_pages,
            )
            enforce_page_version_limit(page_id)

        return
    except Page.DoesNotExist:
        return
    except Exception as e:
        log_exception(e)
        return
