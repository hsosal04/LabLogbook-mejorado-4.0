from datetime import datetime, timedelta
from rest_framework import permissions, viewsets
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from apps.common.permissions import IsAdminRole, IsSupervisorOrAdmin
from .models import ClassroomUsage, ClassSchedule, ComputerUsageRequest, Lab
from .serializers import ClassroomUsageSerializer, ClassScheduleSerializer, ComputerUsageRequestSerializer, LabSerializer, TEXT_RE


class LabViewSet(viewsets.ModelViewSet):
    queryset = Lab.objects.all().order_by('name')
    serializer_class = LabSerializer

    def get_permissions(self):
        if self.action in {'list', 'retrieve'}:
            return [permissions.IsAuthenticated()]
        return [IsAdminRole()]

    def get_queryset(self):
        user = self.request.user
        qs = Lab.objects.all().order_by('name')
        if user.role == 'SUPERVISOR':
            return qs.filter(supervisors=user)
        return qs


class ClassroomUsageViewSet(viewsets.ModelViewSet):
    queryset = ClassroomUsage.objects.select_related('lab', 'professor', 'approved_by').all()
    serializer_class = ClassroomUsageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = self.queryset.order_by('-start_time')
        if user.role == 'ADMIN':
            return qs
        if user.role == 'SUPERVISOR':
            return qs.filter(lab__supervisors=user)
        if user.role == 'PROFESSOR':
            return qs.filter(professor=user)
        return qs.none()

    def perform_create(self, serializer):
        user = self.request.user
        if user.role != 'PROFESSOR':
            raise PermissionDenied('El apartado de uso de salones está disponible únicamente para el rol profesor.')
        serializer.save(professor=user, status='PENDING')

    @action(detail=False, methods=['get'])
    def availability(self, request):
        user = request.user
        if user.role != 'PROFESSOR':
            raise PermissionDenied('La disponibilidad semanal solo está disponible para el rol profesor.')

        lab_id = request.query_params.get('lab')
        if not lab_id:
            raise ValidationError({'lab': 'Debe seleccionar un laboratorio o salón.'})

        try:
            lab = Lab.objects.get(pk=lab_id)
        except Lab.DoesNotExist:
            raise ValidationError({'lab': 'El laboratorio o salón seleccionado no existe.'})

        today = timezone.localdate()
        requested_start = request.query_params.get('week_start')
        if requested_start:
            try:
                week_start = datetime.strptime(requested_start, '%Y-%m-%d').date()
            except ValueError:
                raise ValidationError({'week_start': 'El formato de la semana debe ser YYYY-MM-DD.'})
        else:
            week_start = today - timedelta(days=today.weekday())

        current_week_start = today - timedelta(days=today.weekday())
        if week_start != current_week_start:
            raise ValidationError({'week_start': 'Solo se permite reservar dentro de la semana actual.'})

        week_dates = [week_start + timedelta(days=index) for index in range(5)]
        weekday_map = {
            0: 'MONDAY',
            1: 'TUESDAY',
            2: 'WEDNESDAY',
            3: 'THURSDAY',
            4: 'FRIDAY',
        }
        time_slots = [f'{hour:02d}:00' for hour in range(7, 20)]

        schedule_qs = ClassSchedule.objects.filter(lab=lab, weekday__in=['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'])
        usage_qs = ClassroomUsage.objects.filter(
            lab=lab,
            status__in=['PENDING', 'APPROVED'],
            start_time__date__lte=week_dates[-1],
            end_time__date__gte=week_dates[0],
        ).select_related('professor')

        grid = []
        for date_value in week_dates:
            weekday_code = weekday_map[date_value.weekday()]
            day_cells = []
            for slot in time_slots:
                start_dt = timezone.make_aware(datetime.combine(date_value, datetime.strptime(slot, '%H:%M').time()))
                end_dt = start_dt + timedelta(hours=1)

                if slot == '19:00':
                    day_cells.append({
                        'time': slot,
                        'occupied': False,
                        'status_label': 'Cierre de jornada',
                        'reason': 'Límite de horario institucional',
                        'detail': 'El último bloque reservable termina a las 19:00.',
                        'selectable': False,
                    })
                    continue

                schedule_entry = next((item for item in schedule_qs if item.weekday == weekday_code and self._slot_overlaps(item.time_slot, slot)), None)
                usage_entry = next((item for item in usage_qs if item.start_time < end_dt and item.end_time > start_dt), None)

                occupied = bool(schedule_entry or usage_entry)
                reason = None
                detail = None
                if schedule_entry:
                    reason = 'Horario de clases'
                    detail = schedule_entry.subject_name or schedule_entry.course_code or schedule_entry.nrc or 'Clase programada'
                elif usage_entry:
                    reason = 'Reserva registrada'
                    detail = f"{usage_entry.subject} · {usage_entry.professor.get_full_name() or usage_entry.professor.username}"

                day_cells.append({
                    'time': slot,
                    'occupied': occupied,
                    'status_label': 'Ocupado' if occupied else 'Disponible',
                    'reason': reason,
                    'detail': detail,
                    'selectable': not occupied and date_value >= today,
                })

            grid.append({
                'date': date_value.isoformat(),
                'weekday': weekday_code,
                'cells': day_cells,
            })

        return Response({
            'lab': {'id': lab.id, 'name': lab.name, 'code': lab.code},
            'week_start': week_start.isoformat(),
            'week_end': week_dates[-1].isoformat(),
            'today': today.isoformat(),
            'time_slots': time_slots,
            'days': grid,
        })

    @staticmethod
    def _slot_overlaps(time_slot: str, slot_start: str) -> bool:
        try:
            left, right = time_slot.split('-')
            start_hour = int(left.split(':')[0])
            end_hour = int(right.split(':')[0])
        except Exception:
            return False
        slot_hour = int(slot_start.split(':')[0])
        return start_hour <= slot_hour < end_hour

    def _validate_reviewer(self):
        if self.request.user.role not in {'ADMIN', 'SUPERVISOR'}:
            raise PermissionDenied('Solo administrador o supervisor pueden atender solicitudes de salón.')

    def _validate_supervisor_scope(self, usage_obj):
        user = self.request.user
        if user.role == 'SUPERVISOR' and not usage_obj.lab.supervisors.filter(id=user.id).exists():
            raise PermissionDenied('El supervisor solo puede atender solicitudes de espacios asignados.')

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        self._validate_reviewer()
        usage_obj = self.get_object()
        self._validate_supervisor_scope(usage_obj)
        if usage_obj.status not in {'PENDING', 'APPROVED'}:
            raise ValidationError({'detail': 'Solo se pueden aprobar solicitudes pendientes o previamente aprobadas.'})

        overlaps = ClassroomUsage.objects.filter(
            lab=usage_obj.lab,
            status='APPROVED',
            start_time__lt=usage_obj.end_time,
            end_time__gt=usage_obj.start_time,
        ).exclude(id=usage_obj.id)
        if overlaps.exists():
            raise ValidationError({'detail': 'El salón ya tiene una solicitud aprobada en ese horario.'})

        resolution_notes = (request.data.get('resolution_notes') or '').strip()
        if resolution_notes and not TEXT_RE.fullmatch(resolution_notes):
            raise ValidationError({'resolution_notes': 'Las observaciones contienen caracteres no permitidos.'})
        usage_obj.status = 'APPROVED'
        usage_obj.approved_by = request.user
        usage_obj.resolution_notes = resolution_notes
        usage_obj.save()
        return Response(self.get_serializer(usage_obj).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        self._validate_reviewer()
        usage_obj = self.get_object()
        self._validate_supervisor_scope(usage_obj)
        if usage_obj.status not in {'PENDING', 'APPROVED'}:
            raise ValidationError({'detail': 'Solo se pueden rechazar solicitudes pendientes o aprobadas.'})
        resolution_notes = (request.data.get('resolution_notes') or '').strip()
        if resolution_notes and not TEXT_RE.fullmatch(resolution_notes):
            raise ValidationError({'resolution_notes': 'Las observaciones contienen caracteres no permitidos.'})
        usage_obj.status = 'REJECTED'
        usage_obj.approved_by = request.user
        usage_obj.resolution_notes = resolution_notes
        usage_obj.save()
        return Response(self.get_serializer(usage_obj).data)


class ComputerUsageRequestViewSet(viewsets.ModelViewSet):
    queryset = ComputerUsageRequest.objects.select_related('lab', 'student', 'reviewed_by').all()
    serializer_class = ComputerUsageRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = self.queryset.order_by('-requested_date', '-start_time')
        if user.role == 'ADMIN':
            return qs
        if user.role == 'SUPERVISOR':
            return qs.filter(lab__supervisors=user)
        if user.role == 'STUDENT':
            return qs.filter(student=user)
        return qs.none()

    def perform_create(self, serializer):
        user = self.request.user
        if user.role != 'STUDENT':
            raise PermissionDenied('Solo el alumno puede generar solicitudes de uso de equipo de cómputo.')
        serializer.save(student=user, status='PENDING')

    def _validate_reviewer(self):
        if self.request.user.role not in {'ADMIN', 'SUPERVISOR'}:
            raise PermissionDenied('Solo administrador o supervisor pueden atender solicitudes de computadora.')

    def _validate_supervisor_scope(self, request_obj):
        user = self.request.user
        if user.role == 'SUPERVISOR' and not request_obj.lab.supervisors.filter(id=user.id).exists():
            raise PermissionDenied('El supervisor solo puede atender solicitudes de espacios asignados.')

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        self._validate_reviewer()
        request_obj = self.get_object()
        self._validate_supervisor_scope(request_obj)
        if request_obj.status not in {'PENDING', 'APPROVED'}:
            raise ValidationError({'detail': 'Solo se pueden aprobar solicitudes pendientes o previamente aprobadas.'})

        assigned_computer = (request.data.get('assigned_computer') or '').strip()
        resolution_notes = (request.data.get('resolution_notes') or '').strip()
        if not assigned_computer:
            raise ValidationError({'assigned_computer': 'Debe indicar la computadora asignada.'})
        if not TEXT_RE.fullmatch(assigned_computer):
            raise ValidationError({'assigned_computer': 'La computadora asignada contiene caracteres no permitidos.'})
        if resolution_notes and not TEXT_RE.fullmatch(resolution_notes):
            raise ValidationError({'resolution_notes': 'Las observaciones contienen caracteres no permitidos.'})

        overlaps = ComputerUsageRequest.objects.filter(
            lab=request_obj.lab,
            requested_date=request_obj.requested_date,
            assigned_computer__iexact=assigned_computer,
            status='APPROVED',
            start_time__lt=request_obj.end_time,
            end_time__gt=request_obj.start_time,
        ).exclude(id=request_obj.id)
        if overlaps.exists():
            raise ValidationError({'assigned_computer': 'La computadora ya está asignada en ese horario.'})

        request_obj.assigned_computer = assigned_computer
        request_obj.resolution_notes = resolution_notes
        request_obj.status = 'APPROVED'
        request_obj.reviewed_by = request.user
        request_obj.save()
        return Response(self.get_serializer(request_obj).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        self._validate_reviewer()
        request_obj = self.get_object()
        self._validate_supervisor_scope(request_obj)
        if request_obj.status not in {'PENDING', 'APPROVED'}:
            raise ValidationError({'detail': 'Solo se pueden rechazar solicitudes pendientes o aprobadas.'})
        resolution_notes = (request.data.get('resolution_notes') or '').strip()
        if resolution_notes and not TEXT_RE.fullmatch(resolution_notes):
            raise ValidationError({'resolution_notes': 'Las observaciones contienen caracteres no permitidos.'})
        request_obj.status = 'REJECTED'
        request_obj.reviewed_by = request.user
        request_obj.resolution_notes = resolution_notes
        request_obj.save()
        return Response(self.get_serializer(request_obj).data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        self._validate_reviewer()
        request_obj = self.get_object()
        self._validate_supervisor_scope(request_obj)
        if request_obj.status != 'APPROVED':
            raise ValidationError({'detail': 'Solo se pueden finalizar solicitudes aprobadas.'})
        request_obj.status = 'COMPLETED'
        request_obj.reviewed_by = request.user
        request_obj.save()
        return Response(self.get_serializer(request_obj).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        request_obj = self.get_object()
        if request.user.role != 'STUDENT' or request_obj.student_id != request.user.id:
            raise PermissionDenied('Solo el alumno propietario puede cancelar su solicitud.')
        if request_obj.status != 'PENDING':
            raise ValidationError({'detail': 'Solo se pueden cancelar solicitudes pendientes.'})
        request_obj.status = 'CANCELLED'
        request_obj.save()
        return Response(self.get_serializer(request_obj).data)


class ClassScheduleViewSet(viewsets.ModelViewSet):
    queryset = ClassSchedule.objects.select_related('lab', 'updated_by').all()
    serializer_class = ClassScheduleSerializer

    def get_permissions(self):
        if self.action in {'list', 'retrieve'}:
            return [permissions.IsAuthenticated()]
        return [IsSupervisorOrAdmin()]

    def get_queryset(self):
        user = self.request.user
        qs = self.queryset.order_by('period', 'lab__code', 'weekday', 'time_slot')
        lab_id = self.request.query_params.get('lab')
        period = self.request.query_params.get('period')
        if user.role == 'SUPERVISOR':
            qs = qs.filter(lab__supervisors=user)
        if lab_id:
            qs = qs.filter(lab_id=lab_id)
        if period:
            qs = qs.filter(period=period)
        return qs

    def perform_create(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @action(detail=False, methods=['post'], permission_classes=[IsSupervisorOrAdmin])
    def bulk_upsert(self, request):
        lab_id = request.data.get('lab')
        period = request.data.get('period')
        items = request.data.get('items', [])

        if not lab_id or not period:
            raise ValidationError({'detail': 'Los campos salón y periodo son obligatorios.'})

        allowed_lab_ids = set(Lab.objects.filter(supervisors=request.user).values_list('id', flat=True)) if request.user.role == 'SUPERVISOR' else None
        if request.user.role == 'SUPERVISOR' and int(lab_id) not in allowed_lab_ids:
            raise PermissionDenied('Solo puede editar horarios de los laboratorios o salones que tenga asignados.')

        serializer = self.get_serializer(data=[{
            'lab': lab_id,
            'period': period,
            'weekday': item.get('weekday'),
            'time_slot': item.get('time_slot'),
            'nrc': item.get('nrc', '').strip(),
            'course_code': item.get('course_code', '').strip(),
            'subject_name': item.get('subject_name', '').strip(),
            'section': item.get('section', '').strip(),
            'professor_name': item.get('professor_name', '').strip(),
            'notes': item.get('notes', '').strip(),
        } for item in items], many=True)
        serializer.is_valid(raise_exception=True)

        seen_cells = set()
        for item in serializer.validated_data:
            key = (item['weekday'], item['time_slot'])
            if key in seen_cells:
                raise ValidationError({'detail': 'Se detectaron celdas repetidas en la captura del horario.'})
            seen_cells.add(key)

        for item in serializer.validated_data:
            weekday = item.get('weekday')
            time_slot = item.get('time_slot')
            defaults = {
                'nrc': item.get('nrc', '').strip(),
                'course_code': item.get('course_code', '').strip(),
                'subject_name': item.get('subject_name', '').strip(),
                'section': item.get('section', '').strip(),
                'professor_name': item.get('professor_name', '').strip(),
                'notes': item.get('notes', '').strip(),
                'updated_by': request.user,
            }
            has_content = any(defaults[key] for key in ['nrc', 'course_code', 'subject_name', 'section', 'professor_name', 'notes'])
            existing = ClassSchedule.objects.filter(lab_id=lab_id, period=period, weekday=weekday, time_slot=time_slot).first()
            if has_content:
                if existing:
                    for key, value in defaults.items():
                        setattr(existing, key, value)
                    existing.save()
                else:
                    ClassSchedule.objects.create(
                        lab_id=lab_id,
                        period=period,
                        weekday=weekday,
                        time_slot=time_slot,
                        **defaults,
                    )
            elif existing:
                existing.delete()

        queryset = self.get_queryset().filter(lab_id=lab_id, period=period)
        return Response(ClassScheduleSerializer(queryset, many=True).data)
