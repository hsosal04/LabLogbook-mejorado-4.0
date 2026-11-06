from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import ClassroomViewSet, ClassScheduleViewSet, LaboratoryViewSet, SupervisorAssignmentViewSet

router = DefaultRouter()
router.register('laboratories', LaboratoryViewSet, basename='laboratories')
router.register('classrooms', ClassroomViewSet, basename='classrooms')
router.register('assignments', SupervisorAssignmentViewSet, basename='assignments')
router.register('schedules', ClassScheduleViewSet, basename='schedules')

urlpatterns = [
    path('', include(router.urls)),
]
