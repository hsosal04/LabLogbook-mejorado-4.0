from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('activities', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RemoveField(model_name='activity', name='attendance'),
        migrations.RemoveField(model_name='activity', name='user'),
        migrations.RemoveField(model_name='activity', name='date'),
        migrations.RemoveField(model_name='activity', name='duration_minutes'),
        migrations.AddField(model_name='activity', name='activity_date', field=models.DateField(default='2026-04-22'), preserve_default=False),
        migrations.AddField(model_name='activity', name='class_time', field=models.CharField(blank=True, max_length=30)),
        migrations.AddField(model_name='activity', name='created_by', field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.CASCADE, related_name='created_activities', to=settings.AUTH_USER_MODEL), preserve_default=False),
        migrations.AddField(model_name='activity', name='entry_time', field=models.DateTimeField(blank=True, null=True)),
        migrations.AddField(model_name='activity', name='exit_time', field=models.DateTimeField(blank=True, null=True)),
        migrations.AddField(model_name='activity', name='first_name', field=models.CharField(default='Pendiente', max_length=120), preserve_default=False),
        migrations.AddField(model_name='activity', name='last_name', field=models.CharField(default='Pendiente', max_length=120), preserve_default=False),
        migrations.AddField(model_name='activity', name='nrc', field=models.CharField(blank=True, max_length=20)),
        migrations.AddField(model_name='activity', name='record_type', field=models.CharField(choices=[('STUDENT_ENTRY', 'Registro de alumno'), ('PROFESSOR_REQUEST', 'Solicitud de profesor')], default='STUDENT_ENTRY', max_length=30)),
        migrations.AddField(model_name='activity', name='resolved_at', field=models.DateTimeField(blank=True, null=True)),
        migrations.AddField(model_name='activity', name='resolved_by', field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='resolved_activities', to=settings.AUTH_USER_MODEL)),
        migrations.AddField(model_name='activity', name='student_code', field=models.CharField(default='000000000', max_length=50), preserve_default=False),
        migrations.AddField(model_name='activity', name='subject_name', field=models.CharField(blank=True, max_length=160)),
        migrations.AlterField(model_name='activity', name='description', field=models.TextField(blank=True)),
        migrations.AlterField(model_name='activity', name='status', field=models.CharField(choices=[('OPEN', 'Abierto'), ('CLOSED', 'Cerrado'), ('PENDING', 'Pendiente'), ('ATTENDED', 'Atendido')], default='PENDING', max_length=20)),
        migrations.AlterModelOptions(name='activity', options={'ordering': ['-created_at']}),
    ]
