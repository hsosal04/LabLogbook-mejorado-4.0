from datetime import datetime, timedelta
import re
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from .models import Activity
from apps.labs.models import ClassroomUsage
from .serializers import ActivitySerializer


class ActivityViewSet(viewsets.ModelViewSet):
    queryset = Activity.objects.select_related('lab', 'created_by', 'resolved_by').all()
    serializer_class = ActivitySerializer

    def get_queryset(self):
        user = self.request.user
        qs = self.queryset.order_by('-created_at')
        if user.role == 'PROFESSOR':
            return qs.filter(record_type=Activity.RecordType.PROFESSOR_REQUEST, created_by=user)
        if user.role == 'STUDENT':
            return qs.none()
        if user.role == 'SUPERVISOR':
            # En este módulo solo se revisan ingresos de alumnos.
            # Las solicitudes de salón de profesores se atienden en /app/classroom-requests.
            return qs.filter(record_type=Activity.RecordType.STUDENT_ENTRY, lab__supervisors=user)
        if user.role == 'ADMIN':
            return qs.filter(record_type=Activity.RecordType.STUDENT_ENTRY)
        return qs.none()

    @staticmethod
    def _parse_class_time(class_time: str, activity_date):
        """Convierte textos como '10:00-12:00' o '15:00' en datetimes.

        Este respaldo permite que una solicitud antigua capturada en el módulo
        Actividades también se refleje como solicitud formal de salón.
        """
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

    def _mirror_professor_request_to_classroom_usage(self, activity):
        start_time, end_time = self._parse_class_time(activity.class_time, activity.activity_date)
        notes_parts = []
        if activity.nrc:
            notes_parts.append(f'NRC: {activity.nrc}')
        if activity.class_time:
            notes_parts.append(f'Horario solicitado: {activity.class_time}')
        if activity.description:
            notes_parts.append(activity.description)
        notes_parts.append(f'Origen: actividad #{activity.id}')
        notes = ' | '.join(notes_parts)

        ClassroomUsage.objects.get_or_create(
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

    def perform_create(self, serializer):
        user = self.request.user
        now = timezone.localtime()
        base = {
            'created_by': user,
            'activity_date': timezone.localdate(),
        }
        if user.role in {'ADMIN', 'SUPERVISOR'}:
            serializer.save(
                **base,
                record_type=Activity.RecordType.STUDENT_ENTRY,
                entry_time=now,
                status=Activity.Status.OPEN,
            )
        elif user.role == 'PROFESSOR':
            activity = serializer.save(
                **base,
                record_type=Activity.RecordType.PROFESSOR_REQUEST,
                status=Activity.Status.PENDING,
            )
            self._mirror_professor_request_to_classroom_usage(activity)
        else:
            raise PermissionDenied('No cuenta con permisos para registrar actividades.')

    @action(detail=True, methods=['patch'])
    def close(self, request, pk=None):
        item = self.get_object()
        if request.user.role not in {'ADMIN', 'SUPERVISOR'}:
            raise PermissionDenied('Solo el administrador o supervisor puede cerrar ingresos de alumnos.')
        if item.record_type != Activity.RecordType.STUDENT_ENTRY:
            return Response({'detail': 'Solo se pueden cerrar registros de ingreso de alumnos.'}, status=status.HTTP_400_BAD_REQUEST)
        if item.status == Activity.Status.CLOSED:
            return Response({'detail': 'El registro ya fue cerrado.'}, status=status.HTTP_400_BAD_REQUEST)
        item.exit_time = timezone.localtime()
        item.status = Activity.Status.CLOSED
        item.resolved_at = item.exit_time
        item.resolved_by = request.user
        item.save(update_fields=['exit_time', 'status', 'resolved_at', 'resolved_by', 'updated_at'])
        return Response(self.get_serializer(item).data)

    @action(detail=True, methods=['patch'])
    def attend(self, request, pk=None):
        item = self.get_object()
        if request.user.role not in {'ADMIN', 'SUPERVISOR'}:
            raise PermissionDenied('Solo el administrador o supervisor puede atender solicitudes.')
        if item.record_type != Activity.RecordType.PROFESSOR_REQUEST:
            return Response({'detail': 'Solo se pueden atender solicitudes de profesores.'}, status=status.HTTP_400_BAD_REQUEST)
        if item.status == Activity.Status.ATTENDED:
            return Response({'detail': 'La solicitud ya fue atendida.'}, status=status.HTTP_400_BAD_REQUEST)
        item.status = Activity.Status.ATTENDED
        item.resolved_at = timezone.localtime()
        item.resolved_by = request.user
        item.save(update_fields=['status', 'resolved_at', 'resolved_by', 'updated_at'])
        return Response(self.get_serializer(item).data)
