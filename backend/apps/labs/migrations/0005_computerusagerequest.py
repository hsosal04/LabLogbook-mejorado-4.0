# Generated manually for LabLogbook computer usage requests

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('labs', '0004_delete_classscheduleentry'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ComputerUsageRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('requested_date', models.DateField()),
                ('start_time', models.TimeField()),
                ('end_time', models.TimeField()),
                ('purpose', models.CharField(max_length=160)),
                ('notes', models.TextField(blank=True)),
                ('assigned_computer', models.CharField(blank=True, max_length=80)),
                ('status', models.CharField(choices=[('PENDING', 'Pendiente'), ('APPROVED', 'Aprobada'), ('REJECTED', 'Rechazada'), ('COMPLETED', 'Finalizada'), ('CANCELLED', 'Cancelada')], default='PENDING', max_length=20)),
                ('resolution_notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('lab', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='computer_requests', to='labs.lab')),
                ('reviewed_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reviewed_computer_requests', to=settings.AUTH_USER_MODEL)),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='computer_usage_requests', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-requested_date', '-start_time'],
            },
        ),
    ]
