from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    list_display = ('email', 'username', 'first_name', 'last_name', 'role', 'is_active')
    search_fields = ('email', 'username', 'first_name', 'last_name', 'student_code')
    ordering = ('email',)
    fieldsets = DjangoUserAdmin.fieldsets + (
        ('Información académica', {
            'fields': ('institutional_email', 'alternate_email', 'student_code', 'role', 'phone')
        }),
    )
