# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db.models import Sum
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ProjectEntityPermission, WorkspaceEntityPermission
from plane.app.serializers import IssueWorkLogSerializer
from plane.app.views.base import BaseAPIView, BaseViewSet
from plane.db.models import Issue, IssueWorkLog, ProjectMember, Workspace


class IssueWorkLogViewSet(BaseViewSet):
    permission_classes = [ProjectEntityPermission]
    model = IssueWorkLog
    serializer_class = IssueWorkLogSerializer

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(issue_id=self.kwargs.get("issue_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
            )
            .select_related("actor", "issue", "project")
            .order_by("-logged_at", "-created_at")
            .distinct()
        )

    def _parse_hours_payload(self, data):
        """Accept duration_minutes or hours (+ optional minutes)."""
        payload = dict(data)
        if "duration_minutes" in payload and payload.get("duration_minutes") not in (None, ""):
            return payload
        hours = float(payload.get("hours") or 0)
        minutes = int(payload.get("minutes") or 0)
        total = int(round(hours * 60)) + minutes
        payload["duration_minutes"] = total
        return payload

    def create(self, request, slug, project_id, issue_id):
        if not Issue.objects.filter(pk=issue_id, project_id=project_id, workspace__slug=slug).exists():
            return Response({"error": "Issue not found"}, status=status.HTTP_404_NOT_FOUND)

        payload = self._parse_hours_payload(request.data)
        logged_at = payload.get("logged_at") or timezone.now().date().isoformat()
        serializer = IssueWorkLogSerializer(data={
            "duration_minutes": payload.get("duration_minutes"),
            "description": payload.get("description") or "",
            "logged_at": logged_at,
        })
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        worklog = IssueWorkLog.objects.create(
            project_id=project_id,
            issue_id=issue_id,
            actor=request.user,
            duration_minutes=serializer.validated_data["duration_minutes"],
            description=serializer.validated_data.get("description") or "",
            logged_at=serializer.validated_data["logged_at"],
        )
        out = IssueWorkLogSerializer(worklog).data
        return Response(out, status=status.HTTP_201_CREATED)

    def partial_update(self, request, slug, project_id, issue_id, pk):
        worklog = IssueWorkLog.objects.filter(
            pk=pk, workspace__slug=slug, project_id=project_id, issue_id=issue_id
        ).first()
        if not worklog:
            return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        is_admin = ProjectMember.objects.filter(
            project_id=project_id, member=request.user, is_active=True, role=20
        ).exists()
        if worklog.actor_id != request.user.id and not is_admin:
            return Response({"error": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)

        payload = self._parse_hours_payload(request.data)
        serializer = IssueWorkLogSerializer(worklog, data=payload, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(IssueWorkLogSerializer(worklog).data, status=status.HTTP_200_OK)

    def destroy(self, request, slug, project_id, issue_id, pk):
        worklog = IssueWorkLog.objects.filter(
            pk=pk, workspace__slug=slug, project_id=project_id, issue_id=issue_id
        ).first()
        if not worklog:
            return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        is_admin = ProjectMember.objects.filter(
            project_id=project_id, member=request.user, is_active=True, role=20
        ).exists()
        if worklog.actor_id != request.user.id and not is_admin:
            return Response({"error": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)
        worklog.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspaceWorkLogEndpoint(BaseAPIView):
    permission_classes = [WorkspaceEntityPermission]

    def get(self, request, slug):
        workspace = Workspace.objects.filter(slug=slug).first()
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)

        qs = (
            IssueWorkLog.objects.filter(workspace=workspace)
            .filter(
                project__project_projectmember__member=request.user,
                project__project_projectmember__is_active=True,
            )
            .select_related("actor", "issue", "project")
            .distinct()
        )

        project_id = request.GET.get("project_id")
        actor_id = request.GET.get("actor_id")
        start_date = request.GET.get("start_date")
        end_date = request.GET.get("end_date")

        if project_id:
            qs = qs.filter(project_id=project_id)
        if actor_id:
            qs = qs.filter(actor_id=actor_id)
        if start_date:
            qs = qs.filter(logged_at__gte=start_date)
        if end_date:
            qs = qs.filter(logged_at__lte=end_date)

        if request.GET.get("summary") in ("1", "true", "True"):
            rows = (
                qs.values("actor_id", "actor__display_name", "actor__email", "actor__first_name", "actor__last_name")
                .annotate(total_minutes=Sum("duration_minutes"))
                .order_by("-total_minutes")
            )
            data = [
                {
                    "actor_id": str(r["actor_id"]),
                    "display_name": r["actor__display_name"]
                    or f"{r['actor__first_name'] or ''} {r['actor__last_name'] or ''}".strip()
                    or r["actor__email"],
                    "email": r["actor__email"],
                    "total_minutes": r["total_minutes"] or 0,
                    "total_hours": round((r["total_minutes"] or 0) / 60.0, 2),
                }
                for r in rows
            ]
            return Response({"results": data}, status=status.HTTP_200_OK)

        qs = qs.order_by("-logged_at", "-created_at")[:1000]
        return Response(IssueWorkLogSerializer(qs, many=True).data, status=status.HTTP_200_OK)


class IssueWorkLogSummaryEndpoint(BaseAPIView):
    permission_classes = [ProjectEntityPermission]

    def get(self, request, slug, project_id, issue_id):
        total = (
            IssueWorkLog.objects.filter(
                workspace__slug=slug, project_id=project_id, issue_id=issue_id
            ).aggregate(total=Sum("duration_minutes"))["total"]
            or 0
        )
        by_actor = (
            IssueWorkLog.objects.filter(workspace__slug=slug, project_id=project_id, issue_id=issue_id)
            .values("actor_id", "actor__display_name", "actor__email")
            .annotate(total_minutes=Sum("duration_minutes"))
            .order_by("-total_minutes")
        )
        return Response(
            {
                "total_minutes": total,
                "total_hours": round(total / 60.0, 2),
                "by_actor": [
                    {
                        "actor_id": str(r["actor_id"]),
                        "display_name": r["actor__display_name"] or r["actor__email"],
                        "total_minutes": r["total_minutes"] or 0,
                        "total_hours": round((r["total_minutes"] or 0) / 60.0, 2),
                    }
                    for r in by_actor
                ],
            }
        )
