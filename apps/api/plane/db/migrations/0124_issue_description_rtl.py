# Generated manually for Hesar document/task RTL toggle

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0123_issueworklog"),
    ]

    operations = [
        migrations.AddField(
            model_name="issue",
            name="description_rtl",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="draftissue",
            name="description_rtl",
            field=models.BooleanField(default=False),
        ),
    ]
