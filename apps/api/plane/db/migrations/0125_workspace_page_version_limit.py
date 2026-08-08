# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0124_issue_description_rtl"),
    ]

    operations = [
        migrations.AddField(
            model_name="workspace",
            name="page_version_limit",
            field=models.PositiveIntegerField(default=20),
        ),
    ]
