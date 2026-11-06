from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('labs', '0005_computerusagerequest'),
    ]

    operations = [
        migrations.AddField(
            model_name='classroomusage',
            name='resolution_notes',
            field=models.TextField(blank=True),
        ),
    ]
