# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from __future__ import annotations

import json
import logging
from datetime import datetime, time, timedelta
from typing import Any
from zoneinfo import ZoneInfo

from django.conf import settings
from django.utils import timezone

logger = logging.getLogger("plane.web_push")


def vapid_configured() -> bool:
    return bool(getattr(settings, "WEB_PUSH_VAPID_PRIVATE_KEY", None)) and bool(
        getattr(settings, "WEB_PUSH_VAPID_PUBLIC_KEY", None)
    )


def compute_fire_at(
    *,
    target_date,
    mode: str,
    time_local: str,
    hours_before: int | None,
    tz_name: str,
) -> datetime | None:
    """Compute UTC fire_at from issue due date + alarm settings."""
    if not target_date:
        return None
    try:
        tz = ZoneInfo(tz_name or "UTC")
    except Exception:
        tz = ZoneInfo("UTC")

    if mode == "hours_before":
        hours = int(hours_before or 2)
        # Due date is date-only; treat as end of local day then subtract hours.
        local_due_end = datetime.combine(target_date, time(23, 59, 59), tzinfo=tz)
        return (local_due_end - timedelta(hours=hours)).astimezone(ZoneInfo("UTC"))

    # at_time_on_due_date
    hour, minute = 9, 0
    try:
        parts = (time_local or "09:00").split(":")
        hour = int(parts[0])
        minute = int(parts[1]) if len(parts) > 1 else 0
    except (TypeError, ValueError):
        hour, minute = 9, 0
    local_dt = datetime.combine(target_date, time(hour, minute), tzinfo=tz)
    return local_dt.astimezone(ZoneInfo("UTC"))


def send_web_push_to_user(user_id, payload: dict[str, Any]) -> int:
    """
    Send Web Push to all subscriptions for user_id.
    Returns number of successful deliveries. Drops dead subscriptions (410/404).
    """
    if not vapid_configured():
        return 0

    try:
        from pywebpush import WebPushException, webpush
    except ImportError:
        logger.warning("pywebpush not installed; skipping web push")
        return 0

    from plane.db.models import WebPushSubscription

    subs = list(WebPushSubscription.objects.filter(user_id=user_id))
    if not subs:
        return 0

    claims = {
        "sub": getattr(settings, "WEB_PUSH_VAPID_SUBJECT", "mailto:admin@localhost"),
    }
    vapid_private = settings.WEB_PUSH_VAPID_PRIVATE_KEY
    data = json.dumps(payload)
    sent = 0
    dead_ids: list = []

    for sub in subs:
        subscription_info = {
            "endpoint": sub.endpoint,
            "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
        }
        try:
            webpush(
                subscription_info=subscription_info,
                data=data,
                vapid_private_key=vapid_private,
                vapid_claims=claims,
            )
            sent += 1
        except WebPushException as exc:
            status_code = getattr(getattr(exc, "response", None), "status_code", None)
            if status_code in (404, 410):
                dead_ids.append(sub.id)
            else:
                logger.warning("web push failed for %s: %s", sub.id, exc)
        except Exception as exc:
            logger.warning("web push error for %s: %s", sub.id, exc)

    if dead_ids:
        WebPushSubscription.objects.filter(id__in=dead_ids).delete()

    return sent


def push_assign_notification(*, receiver_id, issue_data: dict, activity_data: dict) -> None:
    title = "تسک به تو assign شد"
    body = f"{issue_data.get('identifier', '')}-{issue_data.get('sequence_id', '')} · {issue_data.get('name', '')}"
    url = _issue_url(issue_data)
    send_web_push_to_user(
        receiver_id,
        {
            "title": title,
            "body": body,
            "tag": f"assign-{issue_data.get('id')}",
            "url": url,
            "requireInteraction": True,
            "sound": "/sounds/alarm.wav",
            "type": "assign",
        },
    )


def push_deadline_alarm(*, receiver_id, issue_data: dict, alarm_id: str) -> None:
    title = "زنگ ددلاین"
    body = f"{issue_data.get('identifier', '')}-{issue_data.get('sequence_id', '')} · {issue_data.get('name', '')}"
    url = _issue_url(issue_data)
    send_web_push_to_user(
        receiver_id,
        {
            "title": title,
            "body": body,
            "tag": f"alarm-{alarm_id}",
            "url": url,
            "requireInteraction": True,
            "sound": "/sounds/alarm.wav",
            "type": "deadline_alarm",
        },
    )


def _issue_url(issue_data: dict) -> str:
    slug = issue_data.get("workspace_slug") or ""
    project_id = issue_data.get("project_id") or ""
    issue_id = issue_data.get("id") or ""
    if slug and project_id and issue_id:
        return f"/{slug}/projects/{project_id}/issues/{issue_id}"
    return "/"


def now_utc():
    return timezone.now()
