from rest_framework import serializers
from .models import ClassScheduleEntry


class ClassScheduleEntrySerializer(serializers.ModelSerializer):
    lab_name = serializers.CharField(source='lab.name', read_only=True)
    lab_code = serializers.CharField(source='lab.code', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    updated_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ClassScheduleEntry
        fields = [
            'id', 'lab', 'lab_name', 'lab_code', 'term', 'weekday', 'time_slot', 'nrc', 'course_code',
            'course_name', 'section', 'professor_name', 'notes', 'created_by', 'created_by_name',
            'updated_by', 'updated_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'updated_by', 'created_at', 'updated_at']

    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() or obj.created_by.username if obj.created_by else None

    def get_updated_by_name(self, obj):
        return obj.updated_by.get_full_name() or obj.updated_by.username if obj.updated_by else None
