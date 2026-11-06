from django.conf import settings
from django.db import models
from apps.spaces.models import Classroom, Laboratory


class Attendance(models.Model):
    class Status(models.TextChoices):
        OPEN = 'OPEN', 'Abierta'
        CLOSED = 'CLOSED', 'Cerrada'
        CANCELED = 'CANCELED', 'Cancelada'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='attendances')
    laboratory = models.ForeignKey(Laboratory, on_delete=models.CASCADE, related_name='attendances')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_attendances')
    check_in = models.DateTimeField()
    check_out = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.OPEN)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ('-check_in',)

    def __str__(self):
        return f'{self.user.email} - {self.laboratory.code} - {self.status}'


class Activity(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pendiente'
        COMPLETE = 'COMPLETE', 'Completo'

    laboratory = models.ForeignKey(Laboratory, on_delete=models.CASCADE, related_name='activities')
    attendance = models.ForeignKey(Attendance, on_delete=models.SET_NULL, null=True, blank=True, related_name='activities')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='activities_created')
    title = models.CharField(max_length=120)
    description = models.TextField()
    activity_date = models.DateField()
    duration_minutes = models.PositiveIntegerField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)

    class Meta:
        ordering = ('-activity_date', '-id')

    def __str__(self):
        return f'{self.title} - {self.laboratory.code}'


class ClassroomUsage(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pendiente'
        APPROVED = 'APPROVED', 'Aprobado'
        REJECTED = 'REJECTED', 'Rechazado'

    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name='usages')
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='classroom_usages')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    purpose = models.TextField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)

    class Meta:
        ordering = ('-start_time',)

    def __str__(self):
        return f'{self.classroom.code} - {self.start_time} - {self.status}'
