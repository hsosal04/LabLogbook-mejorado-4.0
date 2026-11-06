from django.utils import timezone
from rest_framework import serializers
from .models import Attendance


class AttendanceSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    lab_name = serializers.SerializerMethodField()
    duration_minutes = serializers.SerializerMethodField()

    class Meta:
        model = Attendance
        fields = [
            'id', 'user', 'user_name', 'lab', 'lab_name', 'entry_time', 'exit_time',
            'activity_summary', 'status', 'created_by', 'created_at', 'updated_at', 'duration_minutes'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'duration_minutes']
        extra_kwargs = {
            'user': {'required': False},
            'entry_time': {'required': False},
            'exit_time': {'required': False},
            'status': {'required': False},
        }

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def get_lab_name(self, obj):
        return obj.lab.name

    def get_duration_minutes(self, obj):
        if obj.exit_time and obj.entry_time:
            delta = obj.exit_time - obj.entry_time
            return int(delta.total_seconds() // 60)
        return None

    def validate(self, attrs):
        request = self.context.get('request')
        acting_user = getattr(request, 'user', None)

        if not self.instance:
            attrs.setdefault('entry_time', timezone.now())

        if acting_user and getattr(acting_user, 'is_authenticated', False):
            if acting_user.role in {'STUDENT', 'PROFESSOR'}:
                attrs['user'] = acting_user
            elif acting_user.role in {'ADMIN', 'SUPERVISOR'} and not attrs.get('user'):
                raise serializers.ValidationError({'user': 'Debe seleccionar un usuario objetivo para este rol.'})

        user = attrs.get('user', getattr(self.instance, 'user', None))
        entry_time = attrs.get('entry_time', getattr(self.instance, 'entry_time', None))
        exit_time = attrs.get('exit_time', getattr(self.instance, 'exit_time', None))
        status_value = attrs.get('status', getattr(self.instance, 'status', None))

        if exit_time and entry_time and exit_time < entry_time:
            raise serializers.ValidationError({'exit_time': 'La hora de salida debe ser posterior a la hora de entrada.'})

        if status_value == Attendance.Status.CLOSED and not exit_time:
            raise serializers.ValidationError({'exit_time': 'La hora de salida es obligatoria para cerrar la asistencia.'})

        remains_open = not exit_time and status_value != Attendance.Status.CLOSED
        if user and remains_open:
            open_qs = Attendance.objects.filter(user=user, exit_time__isnull=True).exclude(status=Attendance.Status.CLOSED)
            if self.instance:
                open_qs = open_qs.exclude(id=self.instance.id)
            if open_qs.exists():
                raise serializers.ValidationError({'user': 'El usuario ya cuenta con un registro de asistencia abierto.'})

        return attrs
