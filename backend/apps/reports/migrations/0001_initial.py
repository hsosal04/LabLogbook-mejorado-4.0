from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('labs', '0003_merge_0002_classschedule_0002_classscheduleentry'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='IncidentReport',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('reported_by_name', models.CharField(max_length=160)),
                ('severity', models.CharField(choices=[('LOW', 'Baja'), ('MEDIUM', 'Media'), ('HIGH', 'Alta')], default='MEDIUM', max_length=20)),
                ('description', models.TextField()),
                ('status', models.CharField(choices=[('OPEN', 'Abierta'), ('IN_REVIEW', 'En revisión'), ('RESOLVED', 'Resuelta')], default='OPEN', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='created_incident_reports', to=settings.AUTH_USER_MODEL)),
                ('lab', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='incident_reports', to='labs.lab')),
            ],
            options={'ordering': ['-created_at']},
        ),
    ]
