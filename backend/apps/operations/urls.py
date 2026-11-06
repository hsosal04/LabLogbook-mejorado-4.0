from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import (
    ActivityViewSet,
    AttendanceViewSet,
    ClassroomUsageViewSet,
    LaboratoryUtilizationReportView,
    StudentAttendanceReportView,
)

router = DefaultRouter()
router.register('attendances', AttendanceViewSet, basename='attendances')
router.register('activities', ActivityViewSet, basename='activities')
router.register('classroom-usages', ClassroomUsageViewSet, basename='classroom-usages')

urlpatterns = [
    path('', include(router.urls)),
    path('reports/student-attendances/', StudentAttendanceReportView.as_view(), name='student-attendance-report'),
    path('reports/laboratory-utilization/', LaboratoryUtilizationReportView.as_view(), name='laboratory-utilization-report'),
]
