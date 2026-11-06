from django.conf import settings
from django.db import models


class Lab(models.Model):
    class Status(models.TextChoices):
        AVAILABLE = 'AVAILABLE', 'Available'
        MAINTENANCE = 'MAINTENANCE', 'Maintenance'
        INACTIVE = 'INACTIVE', 'Inactive'

    name = models.CharField(max_length=120)
    code = models.CharField(max_length=50, unique=True)
    location = models.CharField(max_length=255)
    capacity = models.PositiveIntegerField(default=1)
    available_computers = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.AVAILABLE)
    supervisors = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name='assigned_labs')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f'{self.code} - {self.name}'


class ClassroomUsage(models.Model):
    class UsageStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pendiente'
        APPROVED = 'APPROVED', 'Aprobada'
        REJECTED = 'REJECTED', 'Rechazada'

    lab = models.ForeignKey(Lab, on_delete=models.CASCADE, related_name='usage_records')
    professor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='classroom_requests')
    subject = models.CharField(max_length=120)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    status = models.CharField(max_length=20, choices=UsageStatus.choices, default=UsageStatus.PENDING)
    notes = models.TextField(blank=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_classroom_requests',
    )
    resolution_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_time']

    def __str__(self) -> str:
        return f'{self.lab.code} | {self.subject} | {self.status}'


class ClassSchedule(models.Model):
    class Weekday(models.TextChoices):
        MONDAY = 'MONDAY', 'Monday'
        TUESDAY = 'TUESDAY', 'Tuesday'
        WEDNESDAY = 'WEDNESDAY', 'Wednesday'
        THURSDAY = 'THURSDAY', 'Thursday'
        FRIDAY = 'FRIDAY', 'Friday'

    lab = models.ForeignKey(Lab, on_delete=models.CASCADE, related_name='class_schedules')
    period = models.CharField(max_length=80, default='PRIMAVERA 2026')
    weekday = models.CharField(max_length=20, choices=Weekday.choices)
    time_slot = models.CharField(max_length=30)
    nrc = models.CharField(max_length=20, blank=True)
    course_code = models.CharField(max_length=40, blank=True)
    subject_name = models.CharField(max_length=160, blank=True)
    section = models.CharField(max_length=30, blank=True)
    professor_name = models.CharField(max_length=160, blank=True)
    notes = models.TextField(blank=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='updated_class_schedules',
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['period', 'lab__code', 'weekday', 'time_slot']
        constraints = [
            models.UniqueConstraint(fields=['lab', 'period', 'weekday', 'time_slot'], name='unique_schedule_cell')
        ]

    def __str__(self) -> str:
        return f'{self.period} | {self.lab.code} | {self.weekday} | {self.time_slot}'



class ComputerUsageRequest(models.Model):
    class RequestStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pendiente'
        APPROVED = 'APPROVED', 'Aprobada'
        REJECTED = 'REJECTED', 'Rechazada'
        COMPLETED = 'COMPLETED', 'Finalizada'
        CANCELLED = 'CANCELLED', 'Cancelada'

    lab = models.ForeignKey(Lab, on_delete=models.CASCADE, related_name='computer_requests')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='computer_usage_requests')
    requested_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    purpose = models.CharField(max_length=160)
    notes = models.TextField(blank=True)
    assigned_computer = models.CharField(max_length=80, blank=True)
    status = models.CharField(max_length=20, choices=RequestStatus.choices, default=RequestStatus.PENDING)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_computer_requests',
    )
    resolution_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-requested_date', '-start_time']

    def __str__(self) -> str:
        return f'{self.lab.code} | {self.student.username} | {self.requested_date} {self.start_time} | {self.status}'
