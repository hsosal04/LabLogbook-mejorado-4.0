from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/users/', include('apps.accounts.user_urls')),
    path('api/labs/', include('apps.labs.urls')),
    path('api/attendance/', include('apps.attendance.urls')),
    path('api/activities/', include('apps.activities.urls')),
    path('api/reports/', include('apps.reports.urls')),
]
