# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ProjectEntityPermission
from plane.app.views.base import BaseAPIView
from plane.db.models import Issue, IssueUserAlarm, WebPushSubscription
from plane.utils.web_push import compute_fire_at, vapid_configured


class MyPendingIssueAlarmsEndpoint(BaseAPIView):
    """List upcoming alarms for sync + settings UI (enabled and recently disabled)."""

    def get(self, request):
        now = timezone.now()
        # Include recently due (15m) so a device that just came online still schedules.
        # Include disabled so the profile list can toggle them back on.
        qs = (
            IssueUserAlarm.objects.filter(
                user=request.user,
                fired_at__isnull=True,
                fire_at__isnull=False,
                fire_at__gte=now - timedelta(minutes=15),
            )
            .select_related("issue", "issue__project", "issue__workspace")
            .order_by("fire_at")[:200]
        )
        results = []
        for alarm in qs:
            issue = alarm.issue
            project = issue.project
            workspace = issue.workspace
            identifier = f"{project.identifier}-{issue.sequence_id}"
            results.append(
                {
                    **IssueUserAlarmEndpoint._serialize(alarm),
                    "issue_id": str(issue.id),
                    "project_id": str(project.id),
                    "workspace_slug": workspace.slug,
                    "issue_name": issue.name,
                    "issue_identifier": identifier,
                    "url": f"/{workspace.slug}/projects/{project.id}/issues/{issue.id}",
                }
            )
        return Response({"results": results}, status=status.HTTP_200_OK)


class WebPushVapidPublicKeyEndpoint(BaseAPIView):
    def get(self, request):
        if not vapid_configured():
            return Response(
                {"configured": False, "public_key": ""},
                status=status.HTTP_200_OK,
            )
        return Response(
            {
                "configured": True,
                "public_key": settings.WEB_PUSH_VAPID_PUBLIC_KEY,
            },
            status=status.HTTP_200_OK,
        )


class WebPushSubscriptionEndpoint(BaseAPIView):
    def post(self, request):
        endpoint = request.data.get("endpoint")
        keys = request.data.get("keys") or {}
        p256dh = keys.get("p256dh")
        auth = keys.get("auth")
        if not endpoint or not p256dh or not auth:
            return Response(
                {"error": "endpoint and keys.p256dh/keys.auth are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        sub, created = WebPushSubscription.objects.update_or_create(
            endpoint=endpoint,
            defaults={
                "user": request.user,
                "p256dh": p256dh,
                "auth": auth,
                "user_agent": request.META.get("HTTP_USER_AGENT", "")[:2000],
            },
        )
        return Response(
            {"id": str(sub.id), "endpoint": sub.endpoint},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def delete(self, request):
        endpoint = request.data.get("endpoint") or request.query_params.get("endpoint")
        qs = WebPushSubscription.objects.filter(user=request.user)
        if endpoint:
            qs = qs.filter(endpoint=endpoint)
        deleted, _ = qs.delete()
        return Response({"deleted": deleted}, status=status.HTTP_200_OK)


class IssueUserAlarmEndpoint(BaseAPIView):
    permission_classes = [ProjectEntityPermission]

    def get(self, request, slug, project_id, issue_id):
        alarm = IssueUserAlarm.objects.filter(user=request.user, issue_id=issue_id).first()
        if not alarm:
            return Response(
                {
                    "enabled": False,
                    "mode": IssueUserAlarm.Mode.AT_TIME_ON_DUE_DATE,
                    "time_local": "09:00",
                    "hours_before": 2,
                    "timezone": getattr(request.user, "user_timezone", None) or "UTC",
                    "fire_at": None,
                    "fired_at": None,
                },
                status=status.HTTP_200_OK,
            )
        return Response(self._serialize(alarm), status=status.HTTP_200_OK)

    def put(self, request, slug, project_id, issue_id):
        issue = Issue.objects.filter(pk=issue_id, project_id=project_id, workspace__slug=slug).first()
        if not issue:
            return Response({"error": "Issue not found"}, status=status.HTTP_404_NOT_FOUND)

        enabled = bool(request.data.get("enabled", False))
        mode = request.data.get("mode") or IssueUserAlarm.Mode.AT_TIME_ON_DUE_DATE
        if mode not in (
            IssueUserAlarm.Mode.AT_TIME_ON_DUE_DATE,
            IssueUserAlarm.Mode.HOURS_BEFORE,
        ):
            return Response({"error": "invalid mode"}, status=status.HTTP_400_BAD_REQUEST)

        time_local = request.data.get("time_local") or "09:00"
        hours_before = request.data.get("hours_before")
        if hours_before is not None:
            try:
                hours_before = max(0, int(hours_before))
            except (TypeError, ValueError):
                hours_before = 2
        else:
            hours_before = 2

        tz_name = request.data.get("timezone") or getattr(request.user, "user_timezone", None) or "UTC"

        existing = IssueUserAlarm.objects.filter(user=request.user, issue_id=issue_id).first()
        fire_at = existing.fire_at if existing else None
        if enabled:
            if not issue.target_date:
                return Response(
                    {"error": "برای زنگ باید ددلاین تسک مشخص باشد"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            fire_at = compute_fire_at(
                target_date=issue.target_date,
                mode=mode,
                time_local=time_local,
                hours_before=hours_before,
                tz_name=tz_name,
            )

        alarm, _ = IssueUserAlarm.objects.update_or_create(
            user=request.user,
            issue=issue,
            defaults={
                "enabled": enabled,
                "mode": mode,
                "time_local": time_local,
                "hours_before": hours_before if mode == IssueUserAlarm.Mode.HOURS_BEFORE else None,
                "timezone": tz_name,
                "fire_at": fire_at,
                "fired_at": None,
            },
        )
        return Response(self._serialize(alarm), status=status.HTTP_200_OK)

    @staticmethod
    def _serialize(alarm: IssueUserAlarm) -> dict:
        return {
            "id": str(alarm.id),
            "enabled": alarm.enabled,
            "mode": alarm.mode,
            "time_local": alarm.time_local,
            "hours_before": alarm.hours_before,
            "timezone": alarm.timezone,
            "fire_at": alarm.fire_at.isoformat() if alarm.fire_at else None,
            "fired_at": alarm.fired_at.isoformat() if alarm.fired_at else None,
        }
