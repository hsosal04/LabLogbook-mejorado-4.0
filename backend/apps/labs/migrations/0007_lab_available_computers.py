# Generated for LabLogbook: computers available per classroom/lab

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('labs', '0006_classroomusage_resolution_notes'),
    ]

    operations = [
        migrations.AddField(
            model_name='lab',
            name='available_computers',
            field=models.PositiveIntegerField(default=0),
        ),
    ]
