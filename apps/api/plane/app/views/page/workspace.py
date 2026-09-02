# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import datetime

from django.db.models import Exists, OuterRef, Q
from rest_framework import serializers, status
from rest_framework.response import Response

from plane.app.permissions import WorkspaceEntityPermission
from plane.app.serializers.page import PageBinaryUpdateSerializer, PageSerializer
from plane.app.views.base import BaseAPIView, BaseViewSet
from plane.bgtasks.page_transaction_task import page_transaction
from plane.bgtasks.page_version_task import track_page_version
from plane.bgtasks.recent_visited_task import recent_visited_task
from plane.db.models import Page, UserFavorite, Workspace, WorkspaceMember

from .base import unarchive_archive_page_and_descendants
from .export_tree import collect_mentioned_pages, collect_page_descendants, serialize_export_tree
from plane.utils.page_version_snapshot import encode_page_snapshot


class WorkspacePageSerializer(PageSerializer):
    """Create/update workspace (wiki) pages with is_global=True, no ProjectPage."""

    class Meta(PageSerializer.Meta):
        fields = PageSerializer.Meta.fields + ["is_global"]

    def create(self, validated_data):
        owned_by_id = self.context["owned_by_id"]
        workspace_id = self.context["workspace_id"]
        description_json = self.context.get("description_json", {})
        description_binary = self.context.get("description_binary", None)
        description_html = self.context.get("description_html", "<p></p>")

        page = Page.objects.create(
            **validated_data,
            description_json=description_json,
            description_binary=description_binary,
            description_html=description_html,
            owned_by_id=owned_by_id,
            workspace_id=workspace_id,
            is_global=True,
        )
        return page


class WorkspacePageDetailSerializer(WorkspacePageSerializer):
    description_html = serializers.CharField()

    class Meta(WorkspacePageSerializer.Meta):
        fields = WorkspacePageSerializer.Meta.fields + ["description_html"]


class WorkspacePageViewSet(BaseViewSet):
    serializer_class = WorkspacePageSerializer
    model = Page
    permission_classes = [WorkspaceEntityPermission]
    search_fields = ["name"]

    def _base_queryset(self):
        subquery = UserFavorite.objects.filter(
            user=self.request.user,
            entity_type="page",
            entity_identifier=OuterRef("pk"),
            workspace__slug=self.kwargs.get("slug"),
        )
        return (
            Page.objects.filter(workspace__slug=self.kwargs.get("slug"), is_global=True)
            .filter(Q(owned_by=self.request.user) | Q(access=0))
            .select_related("workspace", "owned_by")
            .annotate(is_favorite=Exists(subquery))
            .order_by("-is_favorite", "-created_at")
        )

    def get_queryset(self):
        qs = self._base_queryset()
        parent = self.request.GET.get("parent")
        root_only = self.request.GET.get("root_only", "1")
        if parent:
            qs = qs.filter(parent_id=parent)
        elif root_only in ("1", "true", "True"):
            qs = qs.filter(parent__isnull=True)
        return qs

    def list(self, request, slug):
        if not WorkspaceMember.objects.filter(workspace__slug=slug, member=request.user, is_active=True).exists():
            return Response({"error": "Not a workspace member"}, status=status.HTTP_403_FORBIDDEN)
        pages = WorkspacePageSerializer(self.get_queryset(), many=True).data
        return Response(pages, status=status.HTTP_200_OK)

    def create(self, request, slug):
        if not WorkspaceMember.objects.filter(
            workspace__slug=slug, member=request.user, is_active=True, role__gte=15
        ).exists():
            return Response({"error": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)
        workspace = Workspace.objects.filter(slug=slug).first()
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = WorkspacePageSerializer(
            data=request.data,
            context={
                "workspace_id": workspace.id,
                "owned_by_id": request.user.id,
                "description_json": request.data.get("description_json", {}),
                "description_binary": request.data.get("description_binary", None),
                "description_html": request.data.get("description_html", "<p></p>"),
            },
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        page = serializer.save()
        page_transaction.delay(
            new_description_html=request.data.get("description_html", "<p></p>"),
            old_description_html=None,
            page_id=str(page.id),
        )
        return Response(WorkspacePageDetailSerializer(page).data, status=status.HTTP_201_CREATED)

    def retrieve(self, request, slug, page_id):
        page = self._base_queryset().filter(pk=page_id).first()
        if not page:
            return Response({"error": "Page not found"}, status=status.HTTP_404_NOT_FOUND)
        track_visit = request.query_params.get("track_visit", "true").lower() == "true"
        if track_visit:
            recent_visited_task.delay(
                slug=slug,
                entity_name="page",
                entity_identifier=page_id,
                user_id=request.user.id,
                project_id=None,
            )
        return Response(WorkspacePageDetailSerializer(page).data, status=status.HTTP_200_OK)

    def partial_update(self, request, slug, page_id):
        page = self._base_queryset().filter(pk=page_id).first()
        if not page:
            return Response({"error": "Page not found"}, status=status.HTTP_404_NOT_FOUND)
        if page.is_locked:
            return Response({"error": "Page is locked"}, status=status.HTTP_400_BAD_REQUEST)

        parent = request.data.get("parent", None)
        if parent:
            if not Page.objects.filter(pk=parent, workspace__slug=slug, is_global=True).exists():
                return Response({"error": "Parent page not found"}, status=status.HTTP_400_BAD_REQUEST)

        if page.access != request.data.get("access", page.access) and page.owned_by_id != request.user.id:
            return Response(
                {"error": "Access cannot be updated since this page is owned by someone else"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        old_html = page.description_html
        serializer = WorkspacePageDetailSerializer(page, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        if request.data.get("description_html"):
            page_transaction.delay(
                new_description_html=request.data.get("description_html", "<p></p>"),
                old_description_html=old_html,
                page_id=page_id,
            )
        return Response(WorkspacePageDetailSerializer(page).data, status=status.HTTP_200_OK)

    def destroy(self, request, slug, page_id):
        page = self._base_queryset().filter(pk=page_id).first()
        if not page:
            return Response({"error": "Page not found"}, status=status.HTTP_404_NOT_FOUND)
        if page.archived_at is None:
            return Response(
                {"error": "The page should be archived before deleting"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        Page.objects.filter(parent_id=page_id).update(parent=None)
        page.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def archive(self, request, slug, page_id):
        page = self._base_queryset().filter(pk=page_id).first()
        if not page:
            return Response({"error": "Page not found"}, status=status.HTTP_404_NOT_FOUND)
        UserFavorite.objects.filter(
            entity_type="page",
            entity_identifier=page_id,
            workspace__slug=slug,
        ).delete()
        unarchive_archive_page_and_descendants(page_id, datetime.now())
        return Response({"archived_at": str(datetime.now())}, status=status.HTTP_200_OK)

    def unarchive(self, request, slug, page_id):
        page = Page.objects.filter(pk=page_id, workspace__slug=slug, is_global=True).first()
        if not page:
            return Response({"error": "Page not found"}, status=status.HTTP_404_NOT_FOUND)
        if page.parent_id and page.parent and page.parent.archived_at:
            page.parent = None
            page.save(update_fields=["parent"])
        unarchive_archive_page_and_descendants(page_id, None)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def lock(self, request, slug, page_id):
        page = self._base_queryset().filter(pk=page_id).first()
        if not page:
            return Response({"error": "Page not found"}, status=status.HTTP_404_NOT_FOUND)
        page.is_locked = True
        page.save(update_fields=["is_locked"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    def unlock(self, request, slug, page_id):
        page = self._base_queryset().filter(pk=page_id).first()
        if not page:
            return Response({"error": "Page not found"}, status=status.HTTP_404_NOT_FOUND)
        page.is_locked = False
        page.save(update_fields=["is_locked"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    def export_tree(self, request, slug, page_id):
        page = self._base_queryset().filter(pk=page_id).first()
        if not page:
            return Response({"error": "Page not found"}, status=status.HTTP_404_NOT_FOUND)
        qs = Page.objects.filter(workspace__slug=slug, is_global=True)
        pages = collect_mentioned_pages(collect_page_descendants(page, qs), qs)
        return Response(serialize_export_tree(page, pages), status=status.HTTP_200_OK)


class WorkspacePagesDescriptionEndpoint(BaseAPIView):
    permission_classes = [WorkspaceEntityPermission]

    def get(self, request, slug, page_id):
        page = Page.objects.filter(workspace__slug=slug, is_global=True, pk=page_id).first()
        if not page:
            return Response({"error": "Page not found"}, status=status.HTTP_404_NOT_FOUND)
        if page.access == 1 and page.owned_by_id != request.user.id:
            return Response({"error": "Page not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(
            {
                "description_html": page.description_html,
                "description_json": page.description_json,
            },
            status=status.HTTP_200_OK,
        )

    def patch(self, request, slug, page_id):
        page = Page.objects.filter(workspace__slug=slug, is_global=True, pk=page_id).first()
        if not page:
            return Response({"error": "Page not found"}, status=status.HTTP_404_NOT_FOUND)
        if page.is_locked:
            return Response({"error": "Page is locked"}, status=status.HTTP_400_BAD_REQUEST)
        if page.access == 1 and page.owned_by_id != request.user.id:
            return Response({"error": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)

        old_html = page.description_html
        existing_instance = encode_page_snapshot(page)
        serializer = PageBinaryUpdateSerializer(page, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        if request.data.get("description_html"):
            page_transaction.delay(
                new_description_html=request.data.get("description_html", "<p></p>"),
                old_description_html=old_html,
                page_id=page_id,
            )
            track_page_version.delay(
                page_id=page_id,
                existing_instance=existing_instance,
                user_id=request.user.id,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)
