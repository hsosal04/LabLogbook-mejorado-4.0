from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    list_display = ('id', 'username', 'visible_institutional_email', 'role', 'status', 'is_staff')
    list_filter = ('role', 'status', 'is_staff')
    search_fields = ('username', 'institutional_email', 'student_code', 'email')
    fieldsets = DjangoUserAdmin.fieldsets + (
        ('LabLogbook', {'fields': ('institutional_email', 'alternate_email', 'student_code', 'department', 'role', 'status', 'photo_url')}),
    )

    @admin.display(description='Institutional email')
    def visible_institutional_email(self, obj: User):
        return obj.institutional_email
