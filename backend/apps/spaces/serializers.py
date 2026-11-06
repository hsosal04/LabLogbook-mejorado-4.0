from rest_framework import serializers
from .models import Classroom, ClassSchedule, Laboratory, SupervisorAssignment


class LaboratorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Laboratory
        fields = '__all__'


class ClassroomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Classroom
        fields = '__all__'


class SupervisorAssignmentSerializer(serializers.ModelSerializer):
    supervisor_email = serializers.EmailField(source='supervisor.email', read_only=True)
    laboratory_code = serializers.CharField(source='laboratory.code', read_only=True)

    class Meta:
        model = SupervisorAssignment
        fields = ['id', 'supervisor', 'supervisor_email', 'laboratory', 'laboratory_code', 'assigned_at']
        read_only_fields = ['id', 'assigned_at']


class ClassScheduleSerializer(serializers.ModelSerializer):
    classroom_code = serializers.CharField(source='classroom.code', read_only=True)

    class Meta:
        model = ClassSchedule
        fields = [
            'id', 'classroom', 'classroom_code', 'academic_period', 'day_of_week',
            'time_block', 'subject', 'professor_name', 'group_name', 'notes'
        ]
        read_only_fields = ['id']
