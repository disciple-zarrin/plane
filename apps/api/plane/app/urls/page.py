# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path


from plane.app.views import (
    PageViewSet,
    PageFavoriteViewSet,
    PagesDescriptionViewSet,
    PageVersionEndpoint,
    PageDuplicateEndpoint,
    WorkspacePageViewSet,
    WorkspacePagesDescriptionEndpoint,
    WorkspacePageVersionEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages-summary/",
        PageViewSet.as_view({"get": "summary"}),
        name="project-pages-summary",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/",
        PageViewSet.as_view({"get": "list", "post": "create"}),
        name="project-pages",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/",
        PageViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="project-pages",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/favorite-pages/<uuid:page_id>/",
        PageFavoriteViewSet.as_view({"post": "create", "delete": "destroy"}),
        name="user-favorite-pages",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/archive/",
        PageViewSet.as_view({"post": "archive", "delete": "unarchive"}),
        name="project-page-archive-unarchive",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/lock/",
        PageViewSet.as_view({"post": "lock", "delete": "unlock"}),
        name="project-pages-lock-unlock",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/access/",
        PageViewSet.as_view({"post": "access"}),
        name="project-pages-access",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/description/",
        PagesDescriptionViewSet.as_view({"get": "retrieve", "patch": "partial_update"}),
        name="page-description",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/versions/",
        PageVersionEndpoint.as_view(),
        name="page-versions",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/versions/<uuid:pk>/",
        PageVersionEndpoint.as_view(),
        name="page-versions",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/versions/<uuid:pk>/restore/",
        PageVersionEndpoint.as_view(),
        name="page-version-restore",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/export-tree/",
        PageViewSet.as_view({"get": "export_tree"}),
        name="project-page-export-tree",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/duplicate/",
        PageDuplicateEndpoint.as_view(),
        name="page-duplicate",
    ),
    path(
        "workspaces/<str:slug>/pages/",
        WorkspacePageViewSet.as_view({"get": "list", "post": "create"}),
        name="workspace-pages",
    ),
    path(
        "workspaces/<str:slug>/pages/<uuid:page_id>/",
        WorkspacePageViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="workspace-pages-detail",
    ),
    path(
        "workspaces/<str:slug>/pages/<uuid:page_id>/archive/",
        WorkspacePageViewSet.as_view({"post": "archive", "delete": "unarchive"}),
        name="workspace-pages-archive",
    ),
    path(
        "workspaces/<str:slug>/pages/<uuid:page_id>/lock/",
        WorkspacePageViewSet.as_view({"post": "lock", "delete": "unlock"}),
        name="workspace-pages-lock",
    ),
    path(
        "workspaces/<str:slug>/pages/<uuid:page_id>/description/",
        WorkspacePagesDescriptionEndpoint.as_view(),
        name="workspace-page-description",
    ),
    path(
        "workspaces/<str:slug>/pages/<uuid:page_id>/export-tree/",
        WorkspacePageViewSet.as_view({"get": "export_tree"}),
        name="workspace-page-export-tree",
    ),
    path(
        "workspaces/<str:slug>/pages/<uuid:page_id>/versions/",
        WorkspacePageVersionEndpoint.as_view(),
        name="workspace-page-versions",
    ),
    path(
        "workspaces/<str:slug>/pages/<uuid:page_id>/versions/<uuid:pk>/",
        WorkspacePageVersionEndpoint.as_view(),
        name="workspace-page-versions-detail",
    ),
    path(
        "workspaces/<str:slug>/pages/<uuid:page_id>/versions/<uuid:pk>/restore/",
        WorkspacePageVersionEndpoint.as_view(),
        name="workspace-page-version-restore",
    ),
]
