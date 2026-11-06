from django.contrib import admin
from .models import IncidentReport


@admin.register(IncidentReport)
class IncidentReportAdmin(admin.ModelAdmin):
    list_display = ('lab', 'reported_by_name', 'severity', 'status', 'created_at')
    list_filter = ('severity', 'status', 'lab')
    search_fields = ('reported_by_name', 'description', 'lab__name', 'lab__code')
