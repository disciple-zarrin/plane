# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.db.models import Page, PageVersion
from ..base import BaseAPIView
from plane.app.serializers import PageVersionSerializer, PageVersionDetailSerializer
from plane.app.permissions import ProjectPagePermission, WorkspaceEntityPermission


def _restore_page_from_version(page: Page, page_version: PageVersion) -> None:
    page.description_html = page_version.description_html or "<p></p>"
    page.description_binary = page_version.description_binary
    page.description_json = page_version.description_json or {}
    if hasattr(page_version, "description_stripped"):
        page.description_stripped = page_version.description_stripped
    page.save(
        update_fields=[
            "description_html",
            "description_binary",
            "description_json",
            "description_stripped",
            "updated_at",
        ]
    )


class PageVersionEndpoint(BaseAPIView):
    permission_classes = [ProjectPagePermission]

    def get(self, request, slug, project_id, page_id, pk=None):
        if pk:
            page_version = (
                PageVersion.objects.filter(
                    workspace__slug=slug,
                    page__project_pages__project_id=project_id,
                    page__project_pages__deleted_at__isnull=True,
                    page_id=page_id,
                    pk=pk,
                )
                .distinct()
                .get()
            )
            serializer = PageVersionDetailSerializer(page_version)
            return Response(serializer.data, status=status.HTTP_200_OK)
        page_versions = PageVersion.objects.filter(
            workspace__slug=slug,
            page__project_pages__project_id=project_id,
            page__project_pages__deleted_at__isnull=True,
            page_id=page_id,
        ).order_by("-last_saved_at")
        serializer = PageVersionSerializer(page_versions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, slug, project_id, page_id, pk=None):
        """Restore a page to a given version."""
        if not pk:
            return Response({"error": "Version id required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            page = Page.objects.get(
                pk=page_id,
                workspace__slug=slug,
                projects__id=project_id,
                project_pages__deleted_at__isnull=True,
            )
        except Page.DoesNotExist:
            return Response({"error": "Page not found"}, status=status.HTTP_404_NOT_FOUND)
        if page.is_locked:
            return Response({"error": "Page is locked"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            page_version = PageVersion.objects.get(
                workspace__slug=slug,
                page_id=page_id,
                pk=pk,
            )
        except PageVersion.DoesNotExist:
            return Response({"error": "Version not found"}, status=status.HTTP_404_NOT_FOUND)
        _restore_page_from_version(page, page_version)
        return Response(
            {
                "description_html": page.description_html,
                "description_json": page.description_json,
            },
            status=status.HTTP_200_OK,
        )


class WorkspacePageVersionEndpoint(BaseAPIView):
    permission_classes = [WorkspaceEntityPermission]

    def get(self, request, slug, page_id, pk=None):
        page = Page.objects.filter(workspace__slug=slug, is_global=True, pk=page_id).first()
        if not page:
            return Response({"error": "Page not found"}, status=status.HTTP_404_NOT_FOUND)
        if pk:
            page_version = PageVersion.objects.filter(
                workspace__slug=slug, page_id=page_id, pk=pk
            ).first()
            if not page_version:
                return Response({"error": "Version not found"}, status=status.HTTP_404_NOT_FOUND)
            serializer = PageVersionDetailSerializer(page_version)
            return Response(serializer.data, status=status.HTTP_200_OK)
        page_versions = PageVersion.objects.filter(workspace__slug=slug, page_id=page_id).order_by(
            "-last_saved_at"
        )
        serializer = PageVersionSerializer(page_versions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, slug, page_id, pk=None):
        if not pk:
            return Response({"error": "Version id required"}, status=status.HTTP_400_BAD_REQUEST)
        page = Page.objects.filter(workspace__slug=slug, is_global=True, pk=page_id).first()
        if not page:
            return Response({"error": "Page not found"}, status=status.HTTP_404_NOT_FOUND)
        if page.is_locked:
            return Response({"error": "Page is locked"}, status=status.HTTP_400_BAD_REQUEST)
        page_version = PageVersion.objects.filter(workspace__slug=slug, page_id=page_id, pk=pk).first()
        if not page_version:
            return Response({"error": "Version not found"}, status=status.HTTP_404_NOT_FOUND)
        _restore_page_from_version(page, page_version)
        return Response(
            {
                "description_html": page.description_html,
                "description_json": page.description_json,
            },
            status=status.HTTP_200_OK,
        )
