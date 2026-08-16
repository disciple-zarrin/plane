# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path


from plane.app.views import (
    NotificationViewSet,
    UnreadNotificationEndpoint,
    MarkAllReadNotificationViewSet,
    UserNotificationPreferenceEndpoint,
    WebPushVapidPublicKeyEndpoint,
    WebPushSubscriptionEndpoint,
    IssueUserAlarmEndpoint,
    MyPendingIssueAlarmsEndpoint,
)


urlpatterns = [
    path(
        "workspaces/<str:slug>/users/notifications/",
        NotificationViewSet.as_view({"get": "list"}),
        name="notifications",
    ),
    path(
        "workspaces/<str:slug>/users/notifications/<uuid:pk>/",
        NotificationViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="notifications",
    ),
    path(
        "workspaces/<str:slug>/users/notifications/<uuid:pk>/read/",
        NotificationViewSet.as_view({"post": "mark_read", "delete": "mark_unread"}),
        name="notifications",
    ),
    path(
        "workspaces/<str:slug>/users/notifications/<uuid:pk>/archive/",
        NotificationViewSet.as_view({"post": "archive", "delete": "unarchive"}),
        name="notifications",
    ),
    path(
        "workspaces/<str:slug>/users/notifications/unread/",
        UnreadNotificationEndpoint.as_view(),
        name="unread-notifications",
    ),
    path(
        "workspaces/<str:slug>/users/notifications/mark-all-read/",
        MarkAllReadNotificationViewSet.as_view({"post": "create"}),
        name="mark-all-read-notifications",
    ),
    path(
        "users/me/notification-preferences/",
        UserNotificationPreferenceEndpoint.as_view(),
        name="user-notification-preferences",
    ),
    path(
        "users/me/web-push/vapid-public-key/",
        WebPushVapidPublicKeyEndpoint.as_view(),
        name="web-push-vapid-public-key",
    ),
    path(
        "users/me/web-push-subscriptions/",
        WebPushSubscriptionEndpoint.as_view(),
        name="web-push-subscriptions",
    ),
    path(
        "users/me/issue-alarms/",
        MyPendingIssueAlarmsEndpoint.as_view(),
        name="my-pending-issue-alarms",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/my-alarm/",
        IssueUserAlarmEndpoint.as_view(),
        name="issue-user-alarm",
    ),
]
