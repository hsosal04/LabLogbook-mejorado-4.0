from django.urls import path
from .views import AttendanceByLabReportView, UtilizationReportView, IncidentReportListCreateView, incident_status_update

urlpatterns = [
    path('attendance-by-lab/', AttendanceByLabReportView.as_view(), name='attendance-by-lab'),
    path('utilization/', UtilizationReportView.as_view(), name='utilization'),
    path('incidents/', IncidentReportListCreateView.as_view(), name='incident-list-create'),
    path('incidents/<int:pk>/status/', incident_status_update, name='incident-status-update'),
]
