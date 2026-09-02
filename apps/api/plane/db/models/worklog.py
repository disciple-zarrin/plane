# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

# Module imports
from .project import ProjectBaseModel


class IssueWorkLog(ProjectBaseModel):
    """Hours logged by a member on a work item. Multiple members can log on the same issue."""

    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE, related_name="worklogs")
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="issue_worklogs",
    )
    duration_minutes = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    description = models.TextField(blank=True, default="")
    logged_at = models.DateField()

    class Meta:
        verbose_name = "Issue WorkLog"
        verbose_name_plural = "Issue WorkLogs"
        db_table = "issue_worklogs"
        ordering = ("-logged_at", "-created_at")
        indexes = [
            models.Index(fields=["workspace", "logged_at"]),
            models.Index(fields=["project", "logged_at"]),
            models.Index(fields=["actor", "logged_at"]),
            models.Index(fields=["issue"]),
        ]

    def __str__(self):
        return f"{self.issue_id} {self.actor_id} {self.duration_minutes}m"
