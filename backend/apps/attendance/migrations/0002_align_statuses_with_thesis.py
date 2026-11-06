from django.db import migrations, models


def forward_statuses(apps, schema_editor):
    Attendance = apps.get_model("attendance", "Attendance")
    mapping = {
        "REGISTERED": "OPEN",
        "PENDING": "OPEN",
        "EDITED": "OPEN",
        "CLOSED": "CLOSED",
        "CANCELADA": "CANCELED",
        "ABIERTA": "OPEN",
        "CERRADA": "CLOSED",
    }
    for previous, current in mapping.items():
        Attendance.objects.filter(status=previous).update(status=current)


def backward_statuses(apps, schema_editor):
    Attendance = apps.get_model("attendance", "Attendance")
    mapping = {
        "OPEN": "REGISTERED",
        "CLOSED": "CLOSED",
        "CANCELED": "PENDING",
    }
    for current, previous in mapping.items():
        Attendance.objects.filter(status=current).update(status=previous)


class Migration(migrations.Migration):

    dependencies = [
        ("attendance", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="attendance",
            name="status",
            field=models.CharField(
                choices=[("OPEN", "Abierta"), ("CLOSED", "Cerrada"), ("CANCELED", "Cancelada")],
                default="OPEN",
                max_length=20,
            ),
        ),
        migrations.RunPython(forward_statuses, backward_statuses),
    ]
