from rest_framework.routers import DefaultRouter
from .views import ClassroomUsageViewSet, ClassScheduleViewSet, ComputerUsageRequestViewSet, LabViewSet

router = DefaultRouter()
router.register('classroom-usage', ClassroomUsageViewSet, basename='classroom-usage')
router.register('class-schedules', ClassScheduleViewSet, basename='class-schedules')
router.register('computer-requests', ComputerUsageRequestViewSet, basename='computer-requests')
router.register('', LabViewSet, basename='labs')
urlpatterns = router.urls
