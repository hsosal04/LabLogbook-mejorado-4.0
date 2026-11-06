from datetime import datetime, timedelta
import re

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.activities.models import Activity
from apps.labs.models import ClassroomUsage


class Command(BaseCommand):
    help = 'Migra solicitudes antiguas del profesor registradas en Actividades hacia Solicitudes de salón.'

    @staticmethod
    def parse_class_time(class_time: str, activity_date):
        text = (class_time or '').strip()
        matches = re.findall(r'(\d{1,2})(?::(\d{2}))?', text)

        def normalize(match, default_hour=7):
            if not match:
                return default_hour, 0
            hour = int(match[0])
            minute = int(match[1] or '0')
            minute = 0 if minute not in {0, 30} else minute
            return max(0, min(hour, 23)), minute

        start_hour, start_minute = normalize(matches[0] if matches else None, 7)
        if len(matches) >= 2:
            end_hour, end_minute = normalize(matches[1], start_hour + 1)
        else:
            end_hour, end_minute = start_hour + 1, start_minute

        if end_hour <= start_hour and end_hour < 12:
            end_hour += 12
        if start_hour < 7 and start_hour <= 6:
            start_hour += 12
        if end_hour <= start_hour:
            end_hour = start_hour + 1

        start_naive = datetime.combine(activity_date, datetime.min.time()).replace(hour=min(start_hour, 23), minute=start_minute)
        end_naive = datetime.combine(activity_date, datetime.min.time()).replace(hour=min(end_hour, 23), minute=end_minute)
        if end_naive <= start_naive:
            end_naive = start_naive + timedelta(hours=1)
        return timezone.make_aware(start_naive), timezone.make_aware(end_naive)

    def handle(self, *args, **options):
        created = 0
        skipped = 0
        qs = Activity.objects.filter(record_type=Activity.RecordType.PROFESSOR_REQUEST).select_related('lab', 'created_by')
        for activity in qs:
            start_time, end_time = self.parse_class_time(activity.class_time, activity.activity_date)
            notes_parts = []
            if activity.nrc:
                notes_parts.append(f'NRC: {activity.nrc}')
            if activity.class_time:
                notes_parts.append(f'Horario solicitado: {activity.class_time}')
            if activity.description:
                notes_parts.append(activity.description)
            notes_parts.append(f'Origen: actividad #{activity.id}')
            notes = ' | '.join(notes_parts)
            _, was_created = ClassroomUsage.objects.get_or_create(
                lab=activity.lab,
                professor=activity.created_by,
                subject=activity.subject_name or 'Solicitud de salón',
                start_time=start_time,
                end_time=end_time,
                defaults={
                    'status': ClassroomUsage.UsageStatus.PENDING,
                    'notes': notes,
                }
            )
            if was_created:
                created += 1
            else:
                skipped += 1
        self.stdout.write(self.style.SUCCESS(f'Solicitudes sincronizadas: {created}. Ya existentes: {skipped}.'))
