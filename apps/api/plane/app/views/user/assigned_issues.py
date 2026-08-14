# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db.models import Q
from rest_framework import status
from rest_framework.response import Response

from plane.app.views.base import BaseAPIView
from plane.db.models import Issue, StateGroup


def _serialize_issue(issue):
    state = issue.state
    project = issue.project
    workspace = issue.workspace
    return {
        "id": str(issue.id),
        "name": issue.name,
        "sequence_id": issue.sequence_id,
        "priority": issue.priority,
        "sort_order": issue.sort_order,
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
    }


class UserAssignedIssuesEndpoint(BaseAPIView):
    """Assigned work items for the current user across all member workspaces."""

    use_read_replica = True

    def get(self, request):
        include_done = str(request.GET.get("include_done", "")).lower() in ("1", "true", "yes")
        workspace_slug = (request.GET.get("workspace_slug") or "").strip() or None
        project_id = (request.GET.get("project_id") or "").strip() or None
        priority = (request.GET.get("priority") or "").strip() or None
        q = (request.GET.get("q") or "").strip()

        try:
            page = max(1, int(request.GET.get("page", 1)))
        except (TypeError, ValueError):
            page = 1
        try:
            page_size = int(request.GET.get("page_size", 25))
        except (TypeError, ValueError):
            page_size = 25
        page_size = min(max(page_size, 1), 200)

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

        # Facets from the include_done-scoped set (before workspace/project filters).
        facet_base = qs
        workspaces = [
            {"slug": row["workspace__slug"], "name": row["workspace__name"]}
            for row in facet_base.values("workspace__slug", "workspace__name")
            .distinct()
            .order_by("workspace__name")
        ]
        project_facet_qs = facet_base
        if workspace_slug:
            project_facet_qs = project_facet_qs.filter(workspace__slug=workspace_slug)
        projects = [
            {
                "id": str(row["project_id"]),
                "identifier": row["project__identifier"],
                "name": row["project__name"],
                "workspace_slug": row["workspace__slug"],
            }
            for row in project_facet_qs.values(
                "project_id", "project__identifier", "project__name", "workspace__slug"
            )
            .distinct()
            .order_by("project__identifier")
        ]

        if workspace_slug:
            qs = qs.filter(workspace__slug=workspace_slug)
        if project_id:
            qs = qs.filter(project_id=project_id)
        if priority and priority != "all":
            qs = qs.filter(priority=priority)
        if q:
            text_q = (
                Q(name__icontains=q)
                | Q(project__identifier__icontains=q)
                | Q(project__name__icontains=q)
            )
            if q.isdigit():
                text_q = text_q | Q(sequence_id=int(q))
            qs = qs.filter(text_q)

        qs = qs.order_by(
            "workspace__name",
            "project__identifier",
            "sort_order",
            "-priority",
            "target_date",
            "-created_at",
        )

        total = qs.count()
        start = (page - 1) * page_size
        end = start + page_size
        page_qs = list(qs[start:end])
        total_pages = max(1, (total + page_size - 1) // page_size) if total else 1

        results = [_serialize_issue(issue) for issue in page_qs]

        return Response(
            {
                "results": results,
                "count": total,
                "page": page,
                "page_size": page_size,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_previous": page > 1,
                "facets": {
                    "workspaces": workspaces,
                    "projects": projects,
                },
            },
            status=status.HTTP_200_OK,
        )
