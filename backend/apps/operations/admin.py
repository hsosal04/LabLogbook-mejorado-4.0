from django.contrib import admin
from .models import Activity, Attendance, ClassroomUsage

admin.site.register(Attendance)
admin.site.register(Activity)
admin.site.register(ClassroomUsage)
