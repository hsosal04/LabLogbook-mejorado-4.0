from django.contrib import admin
from .models import Classroom, ClassSchedule, Laboratory, SupervisorAssignment

admin.site.register(Laboratory)
admin.site.register(Classroom)
admin.site.register(SupervisorAssignment)
admin.site.register(ClassSchedule)
