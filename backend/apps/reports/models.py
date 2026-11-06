from django.conf import settings
from django.db import models
from apps.labs.models import Lab


class IncidentReport(models.Model):
    class Severity(models.TextChoices):
        LOW = 'LOW', 'Baja'
        MEDIUM = 'MEDIUM', 'Media'
        HIGH = 'HIGH', 'Alta'

    class Status(models.TextChoices):
        OPEN = 'OPEN', 'Abierta'
        IN_REVIEW = 'IN_REVIEW', 'En revisión'
        RESOLVED = 'RESOLVED', 'Resuelta'

    lab = models.ForeignKey(Lab, on_delete=models.CASCADE, related_name='incident_reports')
    reported_by_name = models.CharField(max_length=160)
    severity = models.CharField(max_length=20, choices=Severity.choices, default=Severity.MEDIUM)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_incident_reports',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f'{self.lab.code} | {self.get_status_display()} | {self.get_severity_display()}'
