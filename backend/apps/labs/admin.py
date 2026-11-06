from django.contrib import admin
from .models import ClassroomUsage, ClassSchedule, ComputerUsageRequest, Lab


@admin.register(Lab)
class LabAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'location', 'capacity', 'available_computers', 'status')
    search_fields = ('code', 'name', 'location')
    list_filter = ('status',)


admin.site.register(ClassroomUsage)
admin.site.register(ClassSchedule)
admin.site.register(ComputerUsageRequest)
