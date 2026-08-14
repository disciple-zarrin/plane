# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import status
from rest_framework.response import Response

from plane.app.views.base import BaseAPIView
from plane.db.models import Issue, StateGroup


class UserAssignedIssuesEndpoint(BaseAPIView):
    """Assigned work items for the current user across all member workspaces."""

    use_read_replica = True

    def get(self, request):
        include_done = str(request.GET.get("include_done", "")).lower() in ("1", "true", "yes")

        qs = (
            Issue.issue_objects.filter(
                assignees=request.user,
                project__project_projectmember__member=request.user,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
                workspace__workspace_member__member=request.user,
                workspace__workspace_member__is_active=True,
            )
            .select_related("workspace", "project", "state")
            .distinct()
        )

        if not include_done:
            qs = qs.exclude(
                state__group__in=[StateGroup.COMPLETED.value, StateGroup.CANCELLED.value]
            )

        qs = qs.order_by("workspace__name", "project__identifier", "-priority", "target_date", "-created_at")

        results = []
        for issue in qs[:500]:
            state = issue.state
            project = issue.project
            workspace = issue.workspace
            results.append({
                "id": str(issue.id),
                "name": issue.name,
                "sequence_id": issue.sequence_id,
                "priority": issue.priority,
                "target_date": issue.target_date.isoformat() if issue.target_date else None,
                "start_date": issue.start_date.isoformat() if issue.start_date else None,
                "state": {
                    "id": str(state.id) if state else None,
                    "name": state.name if state else None,
                    "group": state.group if state else None,
                    "color": state.color if state else None,
                },
                "project": {
                    "id": str(project.id),
                    "identifier": project.identifier,
                    "name": project.name,
                },
                "workspace": {
                    "id": str(workspace.id),
                    "slug": workspace.slug,
                    "name": workspace.name,
                },
            })

        return Response({"results": results, "count": len(results)}, status=status.HTTP_200_OK)
