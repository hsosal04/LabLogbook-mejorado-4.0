from django.conf import settings
from django.db import models
from apps.labs.models import Lab


class ClassScheduleEntry(models.Model):
    class Weekday(models.TextChoices):
        MONDAY = 'MONDAY', 'Monday'
        TUESDAY = 'TUESDAY', 'Tuesday'
        WEDNESDAY = 'WEDNESDAY', 'Wednesday'
        THURSDAY = 'THURSDAY', 'Thursday'
        FRIDAY = 'FRIDAY', 'Friday'

    lab = models.ForeignKey(Lab, on_delete=models.CASCADE, related_name='schedule_entries')
    term = models.CharField(max_length=80, default='PRIMAVERA 2026')
    weekday = models.CharField(max_length=12, choices=Weekday.choices)
    time_slot = models.CharField(max_length=50)
    nrc = models.CharField(max_length=20, blank=True)
    course_code = models.CharField(max_length=20, blank=True)
    course_name = models.CharField(max_length=160, blank=True)
    section = models.CharField(max_length=20, blank=True)
    professor_name = models.CharField(max_length=160, blank=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_schedule_entries',
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='updated_schedule_entries',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['term', 'lab__code', 'weekday', 'time_slot']
        constraints = [
            models.UniqueConstraint(
                fields=['lab', 'term', 'weekday', 'time_slot'],
                name='unique_schedule_slot_per_lab_term',
            )
        ]

    def __str__(self) -> str:
        return f'{self.term} | {self.lab.code} | {self.weekday} | {self.time_slot}'
