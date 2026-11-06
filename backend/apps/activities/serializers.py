import re
from django.utils import timezone
from rest_framework import serializers
from .models import Activity

NAME_RE = re.compile(r"^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]+$")
TEXT_RE = re.compile(r'^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9().,#/& -]*$')
NRC_RE = re.compile(r'^\d{0,6}$')
STUDENT_CODE_RE = re.compile(r'^\d{9}$')
CLASS_TIME_RE = re.compile(r'^[0-9: apmAPM-]{0,30}$')


class ActivitySerializer(serializers.ModelSerializer):
    lab_name = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    resolved_by_name = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Activity
        fields = [
            'id', 'record_type', 'status', 'student_code', 'first_name', 'last_name', 'full_name',
            'description', 'subject_name', 'nrc', 'class_time', 'lab', 'lab_name', 'activity_date',
            'entry_time', 'exit_time', 'resolved_at', 'created_by', 'created_by_name', 'resolved_by',
            'resolved_by_name', 'created_at', 'updated_at'
        ]
        # record_type y activity_date se asignan automáticamente en el backend
        # según el rol del usuario autenticado. No deben enviarse desde el formulario.
        read_only_fields = [
            'record_type', 'status', 'activity_date',
            'created_by', 'resolved_by', 'resolved_at',
            'entry_time', 'exit_time', 'created_at', 'updated_at'
        ]

    def get_lab_name(self, obj):
        return obj.lab.name

    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() or obj.created_by.username

    def get_resolved_by_name(self, obj):
        return obj.resolved_by.get_full_name() or obj.resolved_by.username if obj.resolved_by else None

    def get_full_name(self, obj):
        return f'{obj.first_name} {obj.last_name}'.strip()

    def validate_first_name(self, value):
        value = (value or '').strip()
        if not NAME_RE.fullmatch(value):
            raise serializers.ValidationError('El nombre contiene caracteres no permitidos.')
        return value

    def validate_last_name(self, value):
        value = (value or '').strip()
        if not NAME_RE.fullmatch(value):
            raise serializers.ValidationError('Los apellidos contienen caracteres no permitidos.')
        return value

    def validate_student_code(self, value):
        value = (value or '').strip()
        if not STUDENT_CODE_RE.fullmatch(value):
            raise serializers.ValidationError('La matrícula debe contener exactamente 9 dígitos.')
        return value

    def validate_description(self, value):
        value = (value or '').strip()
        if value and not TEXT_RE.fullmatch(value):
            raise serializers.ValidationError('La descripción contiene caracteres no permitidos.')
        return value

    def validate_subject_name(self, value):
        value = (value or '').strip()
        if value and not TEXT_RE.fullmatch(value):
            raise serializers.ValidationError('El nombre de la materia contiene caracteres no permitidos.')
        return value

    def validate_nrc(self, value):
        value = (value or '').strip()
        if value and not NRC_RE.fullmatch(value):
            raise serializers.ValidationError('El NRC debe contener hasta 6 dígitos.')
        return value

    def validate_class_time(self, value):
        value = (value or '').strip()
        if value and not CLASS_TIME_RE.fullmatch(value):
            raise serializers.ValidationError('El formato de la hora de clase no es válido.')
        return value

    def validate(self, attrs):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        today = timezone.localdate()
        record_type = attrs.get('record_type', getattr(self.instance, 'record_type', None))
        activity_date = attrs.get('activity_date', getattr(self.instance, 'activity_date', None))

        # En creación, estos campos no vienen del frontend: se definen en perform_create().
        # Para validar correctamente, se infieren a partir del rol autenticado.
        if not self.instance:
            if user and not record_type:
                if user.role == 'PROFESSOR':
                    record_type = Activity.RecordType.PROFESSOR_REQUEST
                elif user.role in {'ADMIN', 'SUPERVISOR'}:
                    record_type = Activity.RecordType.STUDENT_ENTRY
            if not activity_date:
                activity_date = today
            if activity_date != today:
                raise serializers.ValidationError({'activity_date': 'La fecha solo puede registrarse para el día actual.'})

        if record_type == Activity.RecordType.STUDENT_ENTRY:
            if not attrs.get('description', getattr(self.instance, 'description', '')):
                raise serializers.ValidationError({'description': 'Debe capturar una descripción del ingreso al laboratorio.'})
        if record_type == Activity.RecordType.PROFESSOR_REQUEST:
            if not attrs.get('subject_name', getattr(self.instance, 'subject_name', '')):
                raise serializers.ValidationError({'subject_name': 'Debe indicar el nombre de la materia.'})
            if not attrs.get('nrc', getattr(self.instance, 'nrc', '')):
                raise serializers.ValidationError({'nrc': 'Debe capturar el NRC.'})
            if not attrs.get('class_time', getattr(self.instance, 'class_time', '')):
                raise serializers.ValidationError({'class_time': 'Debe capturar la hora de la clase.'})

        if user and user.role == 'PROFESSOR' and record_type != Activity.RecordType.PROFESSOR_REQUEST:
            raise serializers.ValidationError({'record_type': 'El profesor solo puede registrar solicitudes de cambio o uso de salón.'})
        if user and user.role in {'ADMIN', 'SUPERVISOR'} and record_type != Activity.RecordType.STUDENT_ENTRY:
            raise serializers.ValidationError({'record_type': 'Este rol solo puede registrar ingresos de alumnos.'})
        return attrs
