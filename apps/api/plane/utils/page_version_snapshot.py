# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Serialize / deserialize pre-save page body for version tracking."""

from __future__ import annotations

import base64
import json
from typing import Any

from django.core.serializers.json import DjangoJSONEncoder


def encode_page_snapshot(page) -> str:
    """JSON payload of the page body *before* save (safe for Celery JSON)."""
    binary = getattr(page, "description_binary", None)
    binary_b64 = base64.b64encode(bytes(binary)).decode("ascii") if binary else None
    payload = {
        "description_html": page.description_html,
        "description_json": page.description_json or {},
        "description_binary_b64": binary_b64,
        "description_stripped": getattr(page, "description_stripped", None),
    }
    return json.dumps(payload, cls=DjangoJSONEncoder)


def decode_page_snapshot(existing_instance: str | None) -> dict[str, Any]:
    """Parse Celery payload into fields ready for PageVersion.objects.create."""
    if not existing_instance:
        return {
            "description_html": "<p></p>",
            "description_json": {},
            "description_binary": None,
            "description_stripped": None,
        }
    data = json.loads(existing_instance)
    binary = None
    b64 = data.get("description_binary_b64")
    if b64:
        binary = base64.b64decode(b64)
    html = data.get("description_html")
    return {
        "description_html": html if html is not None else "<p></p>",
        "description_json": data.get("description_json") or {},
        "description_binary": binary,
        "description_stripped": data.get("description_stripped"),
    }
