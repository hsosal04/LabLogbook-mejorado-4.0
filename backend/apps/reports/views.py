from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.attendance.models import Attendance
from apps.common.permissions import IsSupervisorOrAdmin
from .models import IncidentReport
from .serializers import IncidentReportSerializer


class AttendanceByLabReportView(APIView):
    permission_classes = [IsSupervisorOrAdmin]

    def _validated_range(self, start_raw: str | None, end_raw: str | None):
        start_dt = parse_datetime(start_raw) if start_raw else None
        end_dt = parse_datetime(end_raw) if end_raw else None

        if start_raw and not start_dt:
            raise ValidationError({'start': 'La fecha inicial no tiene un formato válido.'})
        if end_raw and not end_dt:
            raise ValidationError({'end': 'La fecha final no tiene un formato válido.'})

        now = timezone.now()
        if start_dt and start_dt > now:
            raise ValidationError({'start': 'La fecha inicial no puede ubicarse en el futuro.'})
        if end_dt and end_dt > now:
            raise ValidationError({'end': 'La fecha final no puede ubicarse en el futuro.'})
        if start_dt and end_dt and end_dt < start_dt:
            raise ValidationError({'end': 'La fecha final debe ser posterior o igual a la fecha inicial.'})

        return start_dt, end_dt

    def get(self, request):
        qs = Attendance.objects.select_related('user', 'lab').all()
        lab_id = request.query_params.get('lab_id')
        user_id = request.query_params.get('user_id')
        start_raw = request.query_params.get('start')
        end_raw = request.query_params.get('end')
        start_dt, end_dt = self._validated_range(start_raw, end_raw)

        if request.user.role == 'SUPERVISOR':
            qs = qs.filter(lab__supervisors=request.user)

        if lab_id:
            qs = qs.filter(lab_id=lab_id)
        if user_id:
            qs = qs.filter(user_id=user_id)
        if start_dt:
            qs = qs.filter(entry_time__gte=start_dt)
        if end_dt:
            qs = qs.filter(entry_time__lte=end_dt)

        rows = []
        total_minutes = 0
        for record in qs.order_by('-entry_time'):
            minutes = None
            if record.exit_time:
                minutes = int((record.exit_time - record.entry_time).total_seconds() // 60)
                total_minutes += minutes
            rows.append({
                'id': record.id,
                'user': record.user.get_full_name() or record.user.username,
                'lab': record.lab.name,
                'entry_time': record.entry_time,
                'exit_time': record.exit_time,
                'status': record.status,
                'duration_minutes': minutes,
            })

        return Response({'count': len(rows), 'total_minutes': total_minutes, 'results': rows})


class UtilizationReportView(APIView):
    permission_classes = [IsSupervisorOrAdmin]

    def get(self, request):
        qs = Attendance.objects.filter(exit_time__isnull=False).select_related('lab')
        if request.user.role == 'SUPERVISOR':
            qs = qs.filter(lab__supervisors=request.user)

        summary = {}
        for item in qs:
            key = str(item.lab.id)
            duration = int((item.exit_time - item.entry_time).total_seconds() // 60)
            if key not in summary:
                summary[key] = {
                    'lab_id': item.lab.id,
                    'lab_name': item.lab.name,
                    'sessions': 0,
                    'total_minutes': 0,
                }
            summary[key]['sessions'] += 1
            summary[key]['total_minutes'] += duration

        return Response({'results': list(summary.values())})


class IncidentReportListCreateView(generics.ListCreateAPIView):
    serializer_class = IncidentReportSerializer
    permission_classes = [IsSupervisorOrAdmin]

    def get_queryset(self):
        qs = IncidentReport.objects.select_related('lab', 'created_by').all()
        if self.request.user.role == 'SUPERVISOR':
            qs = qs.filter(lab__supervisors=self.request.user)
        return qs

    def perform_create(self, serializer):
        lab = serializer.validated_data['lab']
        if self.request.user.role == 'SUPERVISOR' and not lab.supervisors.filter(id=self.request.user.id).exists():
            raise PermissionDenied('Solo puede registrar incidencias de los laboratorios o salones asignados.')
        serializer.save(created_by=self.request.user)


@api_view(['POST'])
@permission_classes([IsSupervisorOrAdmin])
def incident_status_update(request, pk: int):
    incident = IncidentReport.objects.select_related('lab').filter(pk=pk).first()
    if not incident:
        return Response({'detail': 'Incidencia no encontrada.'}, status=404)

    if request.user.role == 'SUPERVISOR' and not incident.lab.supervisors.filter(id=request.user.id).exists():
        raise PermissionDenied('Solo puede actualizar incidencias de los laboratorios o salones asignados.')

    status_value = request.data.get('status')
    allowed = {IncidentReport.Status.OPEN, IncidentReport.Status.IN_REVIEW, IncidentReport.Status.RESOLVED}
    if status_value not in allowed:
        return Response({'status': ['Estado de incidencia no válido.']}, status=400)

    incident.status = status_value
    incident.save(update_fields=['status', 'updated_at'])
    return Response(IncidentReportSerializer(incident).data)
