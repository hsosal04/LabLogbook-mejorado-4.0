import re
from rest_framework import serializers
from .models import IncidentReport

REPORTER_RE = re.compile(r"^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' .-]+$")


class IncidentReportSerializer(serializers.ModelSerializer):
    lab_name = serializers.SerializerMethodField()
    lab_code = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    severity_label = serializers.SerializerMethodField()
    status_label = serializers.SerializerMethodField()

    class Meta:
        model = IncidentReport
        fields = [
            'id', 'lab', 'lab_name', 'lab_code', 'reported_by_name', 'severity', 'severity_label',
            'description', 'status', 'status_label', 'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['status', 'created_by', 'created_by_name', 'created_at', 'updated_at']

    def get_lab_name(self, obj):
        return obj.lab.name

    def get_lab_code(self, obj):
        return obj.lab.code

    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() or obj.created_by.username if obj.created_by else None

    def get_severity_label(self, obj):
        return obj.get_severity_display()

    def get_status_label(self, obj):
        return obj.get_status_display()

    def validate_reported_by_name(self, value: str) -> str:
        value = value.strip()
        if not REPORTER_RE.fullmatch(value):
            raise serializers.ValidationError('El nombre del responsable contiene caracteres no permitidos.')
        return value

    def validate_description(self, value: str) -> str:
        value = value.strip()
        if len(value) < 10:
            raise serializers.ValidationError('La descripción debe contener al menos 10 caracteres.')
        return value
