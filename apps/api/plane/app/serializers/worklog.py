# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import serializers

from plane.app.serializers.base import BaseSerializer
from plane.app.serializers.user import UserLiteSerializer
from plane.db.models import IssueWorkLog


class IssueWorkLogSerializer(BaseSerializer):
    actor_detail = UserLiteSerializer(read_only=True, source="actor")
    issue_identifier = serializers.SerializerMethodField()
    issue_name = serializers.CharField(source="issue.name", read_only=True)
    project_identifier = serializers.CharField(source="project.identifier", read_only=True)
    duration_hours = serializers.SerializerMethodField()

    class Meta:
        model = IssueWorkLog
        fields = [
            "id",
            "workspace",
            "project",
            "project_identifier",
            "issue",
            "issue_identifier",
            "issue_name",
            "actor",
            "actor_detail",
            "duration_minutes",
            "duration_hours",
            "description",
            "logged_at",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = [
            "workspace",
            "project",
            "issue",
            "actor",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]

    def get_duration_hours(self, obj):
        return round(obj.duration_minutes / 60.0, 2)

    def get_issue_identifier(self, obj):
        try:
            return f"{obj.project.identifier}-{obj.issue.sequence_id}"
        except Exception:
            return None

    def validate_duration_minutes(self, value):
        if value is None or int(value) < 1:
            raise serializers.ValidationError("Duration must be at least 1 minute.")
        if int(value) > 24 * 60:
            raise serializers.ValidationError("Duration cannot exceed 24 hours per entry.")
        return int(value)
