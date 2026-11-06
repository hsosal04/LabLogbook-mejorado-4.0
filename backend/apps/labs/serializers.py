import re
from datetime import time, timedelta
from rest_framework import serializers
from django.utils import timezone
from apps.accounts.models import User
from .models import ClassroomUsage, ClassSchedule, ComputerUsageRequest, Lab

CODE_RE = re.compile(r'^[A-Za-z0-9._-]+$')
TEXT_RE = re.compile(r"^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9().,#/& -]+$")
NRC_RE = re.compile(r'^\d{0,6}$')
COURSE_CODE_RE = re.compile(r'^[A-Za-z0-9-]{0,20}$')
SECTION_RE = re.compile(r'^[A-Za-z0-9-]{0,15}$')
PROFESSOR_NAME_RE = re.compile(r"^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' .-]{0,160}$")

ALLOWED_RESERVATION_WEEKDAYS = {0, 1, 2, 3, 4}
RESERVATION_START_HOUR = 7
RESERVATION_END_HOUR = 19


def _slot_overlaps(time_slot: str, slot_start: str) -> bool:
    try:
        left, right = time_slot.split('-')
        start_hour = int(left.split(':')[0])
        end_hour = int(right.split(':')[0])
        slot_hour = int(slot_start.split(':')[0])
    except Exception:
        return False
    return start_hour <= slot_hour < end_hour


class LabSerializer(serializers.ModelSerializer):
    supervisors = serializers.PrimaryKeyRelatedField(queryset=User.objects.filter(role='SUPERVISOR'), many=True, required=False)
    supervisor_names = serializers.SerializerMethodField()

    class Meta:
        model = Lab
        fields = ['id', 'name', 'code', 'location', 'capacity', 'available_computers', 'status', 'supervisors', 'supervisor_names', 'created_at', 'updated_at']

    def get_supervisor_names(self, obj):
        return [user.get_full_name() or user.username for user in obj.supervisors.all()]

    def validate_name(self, value: str) -> str:
        value = value.strip()
        if not TEXT_RE.fullmatch(value):
            raise serializers.ValidationError('El nombre del laboratorio contiene caracteres no permitidos.')
        return value

    def validate_code(self, value: str) -> str:
        value = value.strip().upper()
        if not CODE_RE.fullmatch(value):
            raise serializers.ValidationError('El código solo puede contener letras, números, puntos, guiones y guion bajo.')
        return value

    def validate_location(self, value: str) -> str:
        value = value.strip()
        if not TEXT_RE.fullmatch(value):
            raise serializers.ValidationError('La ubicación contiene caracteres no permitidos.')
        return value


class ClassroomUsageSerializer(serializers.ModelSerializer):
    professor_name = serializers.SerializerMethodField()
    lab_name = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()
    status_label = serializers.SerializerMethodField()

    class Meta:
        model = ClassroomUsage
        fields = [
            'id', 'lab', 'lab_name', 'professor', 'professor_name', 'subject', 'start_time', 'end_time',
            'status', 'status_label', 'notes', 'approved_by', 'approved_by_name', 'resolution_notes', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'professor', 'professor_name', 'status', 'status_label',
            'approved_by', 'approved_by_name', 'resolution_notes', 'created_at', 'updated_at'
        ]

    def get_professor_name(self, obj):
        return obj.professor.get_full_name() or obj.professor.username

    def get_lab_name(self, obj):
        return obj.lab.name

    def get_approved_by_name(self, obj):
        return obj.approved_by.get_full_name() or obj.approved_by.username if obj.approved_by else None

    def get_status_label(self, obj):
        return obj.get_status_display()

    def validate_subject(self, value: str) -> str:
        value = value.strip()
        if not TEXT_RE.fullmatch(value):
            raise serializers.ValidationError('La materia contiene caracteres no permitidos.')
        return value

    def validate_notes(self, value: str) -> str:
        value = value.strip()
        if value and not TEXT_RE.fullmatch(value):
            raise serializers.ValidationError('Las notas contienen caracteres no permitidos.')
        return value

    def validate(self, attrs):
        start_time = attrs.get('start_time', getattr(self.instance, 'start_time', None))
        end_time = attrs.get('end_time', getattr(self.instance, 'end_time', None))
        lab = attrs.get('lab', getattr(self.instance, 'lab', None))

        if start_time and end_time and end_time <= start_time:
            raise serializers.ValidationError('La hora de término debe ser posterior a la hora de inicio.')

        if start_time and end_time:
            local_start = timezone.localtime(start_time)
            local_end = timezone.localtime(end_time)

            if local_start.weekday() not in ALLOWED_RESERVATION_WEEKDAYS:
                raise serializers.ValidationError('Solo se permiten reservas de lunes a viernes.')

            if local_start.minute != 0 or local_end.minute != 0:
                raise serializers.ValidationError('Las reservas deben iniciar y terminar en horas cerradas.')

            reservation_start = time(RESERVATION_START_HOUR, 0)
            reservation_end = time(RESERVATION_END_HOUR, 0)
            if local_start.time() < reservation_start or local_end.time() > reservation_end:
                raise serializers.ValidationError('La reserva debe ubicarse entre 07:00 y 19:00.')

            if local_start.date() != local_end.date():
                raise serializers.ValidationError('La reserva debe iniciar y terminar el mismo día.')

            if (local_end - local_start) < timedelta(hours=1):
                raise serializers.ValidationError('La reserva debe durar al menos una hora.')

            if (local_end - local_start).total_seconds() % 3600 != 0:
                raise serializers.ValidationError('La reserva debe realizarse en bloques completos de una hora.')

            today = timezone.localdate()
            current_week_start = today - timedelta(days=today.weekday())
            current_week_end = current_week_start + timedelta(days=4)
            if not (current_week_start <= local_start.date() <= current_week_end):
                raise serializers.ValidationError('Solo se permite reservar dentro de la semana laboral actual.')

        if lab and start_time and end_time:
            overlaps = ClassroomUsage.objects.filter(
                lab=lab,
                status__in=['PENDING', 'APPROVED'],
                start_time__lt=end_time,
                end_time__gt=start_time,
            )
            if self.instance:
                overlaps = overlaps.exclude(id=self.instance.id)
            if overlaps.exists():
                raise serializers.ValidationError('El salón ya se encuentra ocupado en el horario solicitado.')

            local_start = timezone.localtime(start_time)
            local_end = timezone.localtime(end_time)
            weekday_map = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
            weekday_code = weekday_map[local_start.weekday()]
            class_conflict = ClassSchedule.objects.filter(lab=lab, weekday=weekday_code)
            current_slot = local_start
            while current_slot < local_end:
                slot = f'{current_slot.hour:02d}:00'
                if any(_slot_overlaps(item.time_slot, slot) for item in class_conflict):
                    raise serializers.ValidationError('El salón ya se encuentra ocupado por un horario de clase registrado.')
                current_slot += timedelta(hours=1)

        return attrs


class ComputerUsageRequestSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    student_code = serializers.SerializerMethodField()
    lab_name = serializers.SerializerMethodField()
    lab_code = serializers.SerializerMethodField()
    reviewed_by_name = serializers.SerializerMethodField()
    status_label = serializers.SerializerMethodField()

    class Meta:
        model = ComputerUsageRequest
        fields = [
            'id', 'lab', 'lab_name', 'lab_code', 'student', 'student_name', 'student_code',
            'requested_date', 'start_time', 'end_time', 'purpose', 'notes', 'assigned_computer',
            'status', 'status_label', 'reviewed_by', 'reviewed_by_name', 'resolution_notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'student', 'student_name', 'student_code', 'status', 'status_label', 'reviewed_by',
            'reviewed_by_name', 'assigned_computer', 'resolution_notes', 'created_at', 'updated_at'
        ]

    def get_student_name(self, obj):
        return obj.student.get_full_name() or obj.student.username

    def get_student_code(self, obj):
        return obj.student.student_code

    def get_lab_name(self, obj):
        return obj.lab.name

    def get_lab_code(self, obj):
        return obj.lab.code

    def get_reviewed_by_name(self, obj):
        return obj.reviewed_by.get_full_name() or obj.reviewed_by.username if obj.reviewed_by else None

    def get_status_label(self, obj):
        return obj.get_status_display()

    def validate_purpose(self, value: str) -> str:
        value = value.strip()
        if not TEXT_RE.fullmatch(value):
            raise serializers.ValidationError('El motivo contiene caracteres no permitidos.')
        return value

    def validate_notes(self, value: str) -> str:
        value = (value or '').strip()
        if value and not TEXT_RE.fullmatch(value):
            raise serializers.ValidationError('Las observaciones contienen caracteres no permitidos.')
        return value

    def validate(self, attrs):
        requested_date = attrs.get('requested_date', getattr(self.instance, 'requested_date', None))
        start_time = attrs.get('start_time', getattr(self.instance, 'start_time', None))
        end_time = attrs.get('end_time', getattr(self.instance, 'end_time', None))

        if requested_date:
            if requested_date.weekday() not in ALLOWED_RESERVATION_WEEKDAYS:
                raise serializers.ValidationError('Solo se permiten solicitudes de lunes a viernes.')
            if requested_date < timezone.localdate():
                raise serializers.ValidationError('No se permiten solicitudes con fecha anterior al día actual.')

        if start_time and end_time:
            if end_time <= start_time:
                raise serializers.ValidationError('La hora de término debe ser posterior a la hora de inicio.')
            reservation_start = time(RESERVATION_START_HOUR, 0)
            reservation_end = time(RESERVATION_END_HOUR, 0)
            if start_time < reservation_start or end_time > reservation_end:
                raise serializers.ValidationError('El uso de computadora debe ubicarse entre 07:00 y 17:00.')

        return attrs


class ClassScheduleSerializer(serializers.ModelSerializer):
    lab_name = serializers.SerializerMethodField()
    updated_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ClassSchedule
        fields = [
            'id', 'lab', 'lab_name', 'period', 'weekday', 'time_slot', 'nrc', 'course_code',
            'subject_name', 'section', 'professor_name', 'notes', 'updated_by', 'updated_by_name', 'updated_at'
        ]
        read_only_fields = ['updated_by', 'updated_by_name', 'updated_at']

    def get_lab_name(self, obj):
        return obj.lab.name

    def get_updated_by_name(self, obj):
        return obj.updated_by.get_full_name() or obj.updated_by.username if obj.updated_by else None

    def validate_nrc(self, value: str) -> str:
        value = (value or '').strip()
        if value and not NRC_RE.fullmatch(value):
            raise serializers.ValidationError('El NRC solo puede contener hasta 6 dígitos numéricos.')
        return value

    def validate_course_code(self, value: str) -> str:
        value = (value or '').strip().upper()
        if value and not COURSE_CODE_RE.fullmatch(value):
            raise serializers.ValidationError('La clave de materia contiene caracteres no permitidos.')
        return value

    def validate_subject_name(self, value: str) -> str:
        value = (value or '').strip()
        if value and not TEXT_RE.fullmatch(value):
            raise serializers.ValidationError('El nombre de la materia contiene caracteres no permitidos.')
        return value

    def validate_section(self, value: str) -> str:
        value = (value or '').strip().upper()
        if value and not SECTION_RE.fullmatch(value):
            raise serializers.ValidationError('La sección contiene caracteres no permitidos.')
        return value

    def validate_professor_name(self, value: str) -> str:
        value = (value or '').strip()
        if value and not PROFESSOR_NAME_RE.fullmatch(value):
            raise serializers.ValidationError('El nombre del profesor contiene caracteres no permitidos.')
        return value

    def validate_notes(self, value: str) -> str:
        value = (value or '').strip()
        return value
