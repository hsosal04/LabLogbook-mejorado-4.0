from django.db.models import Q, Sum
from rest_framework import serializers
from .models import Activity, Attendance, ClassroomUsage


class AttendanceSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    laboratory_code = serializers.CharField(source='laboratory.code', read_only=True)

    class Meta:
        model = Attendance
        fields = [
            'id', 'user', 'user_email', 'laboratory', 'laboratory_code',
            'created_by', 'check_in', 'check_out', 'status', 'notes'
        ]
        read_only_fields = ['id', 'created_by']

    def validate(self, attrs):
        instance = getattr(self, 'instance', None)
        user = attrs.get('user') or getattr(instance, 'user', None)
        check_in = attrs.get('check_in') or getattr(instance, 'check_in', None)
        check_out = attrs.get('check_out') or getattr(instance, 'check_out', None)
        status = attrs.get('status') or getattr(instance, 'status', Attendance.Status.OPEN)

        if check_out and check_in and check_out <= check_in:
            raise serializers.ValidationError('La hora de salida debe ser posterior a la hora de entrada.')

        if user and status == Attendance.Status.OPEN:
            queryset = Attendance.objects.filter(user=user, status=Attendance.Status.OPEN)
            if instance:
                queryset = queryset.exclude(pk=instance.pk)
            if queryset.exists():
                raise serializers.ValidationError('El usuario ya cuenta con una asistencia abierta.')

        return attrs

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class ActivitySerializer(serializers.ModelSerializer):
    laboratory_code = serializers.CharField(source='laboratory.code', read_only=True)

    class Meta:
        model = Activity
        fields = [
            'id', 'laboratory', 'laboratory_code', 'attendance', 'created_by',
            'title', 'description', 'activity_date', 'duration_minutes', 'status'
        ]
        read_only_fields = ['id', 'created_by']

    def validate(self, attrs):
        attendance = attrs.get('attendance')
        laboratory = attrs.get('laboratory')
        duration = attrs.get('duration_minutes', 0)
        if duration <= 0:
            raise serializers.ValidationError('La duración debe ser mayor a cero.')
        if attendance and laboratory and attendance.laboratory_id != laboratory.id:
            raise serializers.ValidationError('La asistencia seleccionada no corresponde al laboratorio indicado.')
        return attrs

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class ClassroomUsageSerializer(serializers.ModelSerializer):
    classroom_code = serializers.CharField(source='classroom.code', read_only=True)

    class Meta:
        model = ClassroomUsage
        fields = [
            'id', 'classroom', 'classroom_code', 'requested_by',
            'start_time', 'end_time', 'purpose', 'status'
        ]
        read_only_fields = ['id', 'requested_by']

    def validate(self, attrs):
        start_time = attrs.get('start_time')
        end_time = attrs.get('end_time')
        classroom = attrs.get('classroom')
        instance = getattr(self, 'instance', None)

        if start_time and end_time and end_time <= start_time:
            raise serializers.ValidationError('La hora final debe ser posterior a la hora inicial.')

        if classroom and start_time and end_time:
            overlaps = ClassroomUsage.objects.filter(
                classroom=classroom,
                status__in=[ClassroomUsage.Status.PENDING, ClassroomUsage.Status.APPROVED]
            ).filter(Q(start_time__lt=end_time) & Q(end_time__gt=start_time))
            if instance:
                overlaps = overlaps.exclude(pk=instance.pk)
            if overlaps.exists():
                raise serializers.ValidationError('Ya existe un uso o solicitud que se traslapa con el horario capturado.')
        return attrs

    def create(self, validated_data):
        validated_data['requested_by'] = self.context['request'].user
        return super().create(validated_data)


class AttendanceSummarySerializer(serializers.Serializer):
    total_records = serializers.IntegerField()
    open_records = serializers.IntegerField()
    closed_records = serializers.IntegerField()


class LaboratoryUtilizationSerializer(serializers.Serializer):
    laboratory_id = serializers.IntegerField()
    laboratory_code = serializers.CharField()
    total_sessions = serializers.IntegerField()
    total_minutes = serializers.IntegerField()
