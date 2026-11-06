from django.core.management.base import BaseCommand
from apps.users.models import User
from apps.spaces.models import Classroom, ClassSchedule, Laboratory, SupervisorAssignment
from apps.operations.models import Attendance, Activity, ClassroomUsage
from django.utils import timezone
from datetime import timedelta


class Command(BaseCommand):
    help = 'Carga datos de demostración para LabLogbook.'

    def handle(self, *args, **options):
        admin, _ = User.objects.get_or_create(
            email='admin@lablogbook.local',
            defaults={
                'username': 'admin', 'first_name': 'Admin', 'last_name': 'Sistema',
                'role': User.Role.ADMIN, 'is_staff': True, 'is_superuser': True,
                'institutional_email': 'admin@buap.mx'
            }
        )
        admin.set_password('Admin1234!')
        admin.save()

        supervisor, _ = User.objects.get_or_create(
            email='supervisor@lablogbook.local',
            defaults={
                'username': 'supervisor', 'first_name': 'Laura', 'last_name': 'Supervisor',
                'role': User.Role.SUPERVISOR, 'institutional_email': 'supervisor@buap.mx'
            }
        )
        supervisor.set_password('Supervisor1234!')
        supervisor.save()

        professor, _ = User.objects.get_or_create(
            email='profesor@lablogbook.local',
            defaults={
                'username': 'profesor', 'first_name': 'Carlos', 'last_name': 'Profesor',
                'role': User.Role.PROFESSOR, 'institutional_email': 'profesor@buap.mx'
            }
        )
        professor.set_password('Profesor1234!')
        professor.save()

        student, _ = User.objects.get_or_create(
            email='estudiante@lablogbook.local',
            defaults={
                'username': 'estudiante', 'first_name': 'Ana', 'last_name': 'Estudiante',
                'role': User.Role.STUDENT, 'institutional_email': 'estudiante@alumno.buap.mx',
                'student_code': '202058364'
            }
        )
        student.set_password('Estudiante1234!')
        student.save()

        lab1, _ = Laboratory.objects.get_or_create(code='LAB-101', defaults={'name': 'Laboratorio de Redes', 'location': 'Edificio A', 'capacity': 30})
        lab2, _ = Laboratory.objects.get_or_create(code='LAB-202', defaults={'name': 'Laboratorio de Programación', 'location': 'Edificio B', 'capacity': 25})

        classroom, _ = Classroom.objects.get_or_create(code='SAL-301', defaults={'name': 'Salón 301', 'building': 'CCO', 'capacity': 40})

        SupervisorAssignment.objects.get_or_create(supervisor=supervisor, laboratory=lab1)
        SupervisorAssignment.objects.get_or_create(supervisor=supervisor, laboratory=lab2)

        ClassSchedule.objects.get_or_create(
            classroom=classroom,
            academic_period='Primavera 2026',
            day_of_week='MON',
            time_block='08:00-09:00',
            defaults={'subject': 'Programación', 'professor_name': 'Carlos Profesor', 'group_name': '1A'}
        )

        attendance, _ = Attendance.objects.get_or_create(
            user=student,
            laboratory=lab1,
            check_in=timezone.now() - timedelta(hours=2),
            defaults={'created_by': supervisor, 'status': Attendance.Status.OPEN}
        )

        Activity.objects.get_or_create(
            laboratory=lab1,
            attendance=attendance,
            title='Práctica de laboratorio',
            defaults={
                'description': 'Configuración inicial de equipos.',
                'activity_date': timezone.now().date(),
                'duration_minutes': 90,
                'status': Activity.Status.COMPLETE,
                'created_by': supervisor,
            }
        )

        ClassroomUsage.objects.get_or_create(
            classroom=classroom,
            requested_by=professor,
            start_time=timezone.now() + timedelta(days=1),
            end_time=timezone.now() + timedelta(days=1, hours=2),
            defaults={'purpose': 'Clase extraordinaria', 'status': ClassroomUsage.Status.APPROVED}
        )

        self.stdout.write(self.style.SUCCESS('Datos de demostración cargados correctamente.'))
