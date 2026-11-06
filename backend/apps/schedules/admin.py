from django.contrib import admin
from .models import ClassScheduleEntry


@admin.register(ClassScheduleEntry)
class ClassScheduleEntryAdmin(admin.ModelAdmin):
    list_display = ('term', 'lab', 'weekday', 'time_slot', 'course_name', 'professor_name')
    list_filter = ('term', 'weekday', 'lab')
    search_fields = ('lab__code', 'course_name', 'course_code', 'professor_name', 'nrc')
