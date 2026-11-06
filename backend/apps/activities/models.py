from django.conf import settings
from django.db import models
from apps.labs.models import Lab


class Activity(models.Model):
    class RecordType(models.TextChoices):
        STUDENT_ENTRY = 'STUDENT_ENTRY', 'Registro de alumno'
        PROFESSOR_REQUEST = 'PROFESSOR_REQUEST', 'Solicitud de profesor'

    class Status(models.TextChoices):
        OPEN = 'OPEN', 'Abierto'
        CLOSED = 'CLOSED', 'Cerrado'
        PENDING = 'PENDING', 'Pendiente'
        ATTENDED = 'ATTENDED', 'Atendido'

    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_activities')
    lab = models.ForeignKey(Lab, on_delete=models.CASCADE, related_name='activities')
    record_type = models.CharField(max_length=30, choices=RecordType.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)

    student_code = models.CharField(max_length=50)
    first_name = models.CharField(max_length=120)
    last_name = models.CharField(max_length=120)
    description = models.TextField(blank=True)

    subject_name = models.CharField(max_length=160, blank=True)
    nrc = models.CharField(max_length=20, blank=True)
    class_time = models.CharField(max_length=30, blank=True)

    activity_date = models.DateField()
    entry_time = models.DateTimeField(null=True, blank=True)
    exit_time = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='resolved_activities'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f'{self.record_type} - {self.student_code} - {self.status}'
