from rest_framework.routers import DefaultRouter
from .views import ClassScheduleEntryViewSet

router = DefaultRouter()
router.register('', ClassScheduleEntryViewSet, basename='schedules')
urlpatterns = router.urls
