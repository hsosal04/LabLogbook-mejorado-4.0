from django.conf import settings
from django.db import models


class Laboratory(models.Model):
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=120)
    location = models.CharField(max_length=120)
    capacity = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f'{self.code} - {self.name}'


class Classroom(models.Model):
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=120)
    building = models.CharField(max_length=120)
    capacity = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f'{self.code} - {self.name}'


class SupervisorAssignment(models.Model):
    supervisor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='laboratory_assignments')
    laboratory = models.ForeignKey(Laboratory, on_delete=models.CASCADE, related_name='supervisor_assignments')
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('supervisor', 'laboratory')

    def __str__(self):
        return f'{self.supervisor.email} -> {self.laboratory.code}'


class ClassSchedule(models.Model):
    class Day(models.TextChoices):
        MON = 'MON', 'Lunes'
        TUE = 'TUE', 'Martes'
        WED = 'WED', 'Miércoles'
        THU = 'THU', 'Jueves'
        FRI = 'FRI', 'Viernes'
        SAT = 'SAT', 'Sábado'

    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name='schedules')
    academic_period = models.CharField(max_length=80)
    day_of_week = models.CharField(max_length=3, choices=Day.choices)
    time_block = models.CharField(max_length=50)
    subject = models.CharField(max_length=120)
    professor_name = models.CharField(max_length=120, blank=True)
    group_name = models.CharField(max_length=80, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        unique_together = ('classroom', 'academic_period', 'day_of_week', 'time_block')
        ordering = ('academic_period', 'day_of_week', 'time_block')

    def __str__(self):
        return f'{self.classroom.code} - {self.academic_period} - {self.day_of_week} - {self.time_block}'
