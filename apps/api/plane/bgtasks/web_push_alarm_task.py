# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from celery import shared_task
from django.utils import timezone

from plane.db.models import IssueUserAlarm
from plane.utils.web_push import push_deadline_alarm


@shared_task
def fire_due_issue_alarms():
    """Celery beat: push deadline alarms that are due and not yet fired."""
    now = timezone.now()
    due = (
        IssueUserAlarm.objects.filter(enabled=True, fired_at__isnull=True, fire_at__lte=now)
        .select_related("issue", "issue__project", "issue__project__workspace", "issue__state")
        .order_by("fire_at")[:200]
    )

    for alarm in due:
        issue = alarm.issue
        if not issue or not issue.target_date:
            alarm.enabled = False
            alarm.save(update_fields=["enabled", "updated_at"])
            continue

        issue_data = {
            "id": str(issue.id),
            "name": issue.name,
            "identifier": issue.project.identifier,
            "sequence_id": issue.sequence_id,
            "project_id": str(issue.project_id),
            "workspace_slug": issue.project.workspace.slug,
            "state_name": getattr(issue.state, "name", "") if issue.state_id else "",
            "state_group": getattr(issue.state, "group", "") if issue.state_id else "",
        }
        push_deadline_alarm(receiver_id=alarm.user_id, issue_data=issue_data, alarm_id=str(alarm.id))
        alarm.fired_at = now
        alarm.save(update_fields=["fired_at", "updated_at"])

    return True


@shared_task
def recompute_alarms_for_issue(issue_id: str):
    """When target_date changes, refresh fire_at for enabled alarms."""
    from plane.db.models import Issue
    from plane.utils.web_push import compute_fire_at

    issue = Issue.objects.filter(pk=issue_id).first()
    if not issue:
        return False

    alarms = IssueUserAlarm.objects.filter(issue_id=issue_id, enabled=True)
    for alarm in alarms:
        if not issue.target_date:
            alarm.enabled = False
            alarm.fire_at = None
            alarm.save(update_fields=["enabled", "fire_at", "updated_at"])
            continue
        alarm.fire_at = compute_fire_at(
            target_date=issue.target_date,
            mode=alarm.mode,
            time_local=alarm.time_local,
            hours_before=alarm.hours_before,
            tz_name=alarm.timezone,
        )
        alarm.fired_at = None
        alarm.save(update_fields=["fire_at", "fired_at", "updated_at"])
    return True
