from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import ProfileView, RegisterView, UserViewSet

router = DefaultRouter()
router.register('users', UserViewSet, basename='users')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('me/', ProfileView.as_view(), name='me'),
    path('', include(router.urls)),
]
