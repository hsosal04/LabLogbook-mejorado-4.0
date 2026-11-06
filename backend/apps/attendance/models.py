from django.conf import settings
from django.db import models
from apps.labs.models import Lab


class Attendance(models.Model):
    class Status(models.TextChoices):
        REGISTERED = 'REGISTERED', 'Registered'
        PENDING = 'PENDING', 'Pending'
        EDITED = 'EDITED', 'Edited'
        CLOSED = 'CLOSED', 'Closed'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='attendances')
    lab = models.ForeignKey(Lab, on_delete=models.CASCADE, related_name='attendances')
    entry_time = models.DateTimeField()
    exit_time = models.DateTimeField(blank=True, null=True)
    activity_summary = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.REGISTERED)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_attendances')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-entry_time']

    def __str__(self) -> str:
        return f'{self.user.username} - {self.lab.code} - {self.status}'
