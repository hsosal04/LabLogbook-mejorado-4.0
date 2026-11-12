from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.accounts.models import User
from apps.accounts.fcc_professors import PROFESSOR_NAMES
from apps.activities.models import Activity
from apps.attendance.models import Attendance
from apps.labs.models import ClassroomUsage, ComputerUsageRequest, Lab
from apps.reports.models import IncidentReport


FCC_CLASSROOMS = [
    'CCO2 207', 'CCO2 208',

    'CCO3 101', 'CCO3 104', 'CCO3 109', 'CCO3 114',
    'CCO3 301', 'CCO3 302', 'CCO3 303', 'CCO3 309', 'CCO3 310',

    'CCO4 206', 'CCO4 306', 'CCO4 307', 'CCO4 308',
    'CCO4 403', 'CCO4 404',
]


def build_lab_payload(label: str) -> dict:
    building, room = label.split()
    return {
        'code': f'{building}-{room}',
        'name': f'Salon {label}',
        'location': f'{building} - Aula {room}',
        'capacity': 35,
        'status': 'AVAILABLE',
    }


class Command(BaseCommand):
    help = 'Seeds demo data for LabLogbook.'

    def handle(self, *args, **options):
        admin, _ = User.objects.get_or_create(
            username='202058364',
            defaults={
                'email': 'hsosal04@gmail.com',
                'institutional_email': 'hugo.sosal@outlook.buap.mx',
                'student_code': '202058364',
                'role': 'ADMIN',
                'first_name': 'Hugo',
                'last_name': 'Sosa Lorenzo',
                'is_staff': True,
                'is_superuser': True,
                'status': 'ACTIVE',
                'is_active': True,
                'department': 'FCC',
            }
        )
        admin.set_password('yoga0401')
        admin.is_staff = True
        admin.is_superuser = True
        admin.role = 'ADMIN'
        admin.status = 'ACTIVE'
        admin.is_active = True
        admin.department = admin.department or 'FCC'
        admin.save()

        supervisor, _ = User.objects.get_or_create(
            username='supervisor',
            defaults={
                'email': 'supervisor@example.com',
                'institutional_email': 'supervisor@lablogbook.edu',
                'student_code': 'SUP-001',
                'role': 'SUPERVISOR',
                'first_name': 'Lab',
                'last_name': 'Supervisor',
                'status': 'ACTIVE',
                'is_active': True,
                'department': 'FCC',
            }
        )
        supervisor.set_password('yoga0401')
        supervisor.role = 'SUPERVISOR'
        supervisor.status = 'ACTIVE'
        supervisor.is_active = True
        supervisor.department = supervisor.department or 'FCC'
        supervisor.save()

        student, _ = User.objects.get_or_create(
            username='student',
            defaults={
                'email': 'student@example.com',
                'institutional_email': 'student@lablogbook.edu',
                'student_code': 'STD-001',
                'role': 'STUDENT',
                'first_name': 'Demo',
                'last_name': 'Student',
                'status': 'ACTIVE',
                'is_active': True,
                'department': 'FCC',
            }
        )
        student.set_password('yoga0401')
        student.role = 'STUDENT'
        student.status = 'ACTIVE'
        student.is_active = True
        student.department = student.department or 'FCC'
        student.save()

        # El directorio docente se usa como catálogo de nombres para horarios.
        # Los profesores reales se registran con su propio correo institucional,
        # pero aquí se crea un profesor de demostración para probar el rol.
        User.objects.filter(role='PROFESSOR', student_code__startswith='PROF-').delete()

        professor, _ = User.objects.get_or_create(
            username='professor',
            defaults={
                'email': 'professor@example.com',
                'institutional_email': 'professor@lablogbook.edu',
                'student_code': 'PROF-001',
                'role': 'PROFESSOR',
                'first_name': 'Demo',
                'last_name': 'Profesor',
                'status': 'ACTIVE',
                'is_active': True,
                'department': 'FCC',
            }
        )
        professor.set_password('yoga0401')
        professor.role = 'PROFESSOR'
        professor.status = 'ACTIVE'
        professor.is_active = True
        professor.department = professor.department or 'FCC'
        professor.save()

        desired_codes = []
        for label in FCC_CLASSROOMS:
            payload = build_lab_payload(label)
            desired_codes.append(payload['code'])
            lab, _ = Lab.objects.update_or_create(
                code=payload['code'],
                defaults={
                    'name': payload['name'],
                    'location': payload['location'],
                    'capacity': payload['capacity'],
                    'status': payload['status'],
                }
            )
            lab.supervisors.add(supervisor)

        Lab.objects.exclude(code__in=desired_codes).delete()

        primary_lab = Lab.objects.get(code='CCO2-207')
        attendance, _ = Attendance.objects.get_or_create(
            user=student,
            lab=primary_lab,
            entry_time=timezone.now(),
            defaults={'created_by': supervisor, 'status': 'REGISTERED'}
        )

        Activity.objects.get_or_create(
            created_by=supervisor,
            lab=primary_lab,
            record_type=Activity.RecordType.STUDENT_ENTRY,
            student_code=student.student_code or '202500001',
            first_name=student.first_name or 'Demo',
            last_name=student.last_name or 'Student',
            activity_date=timezone.localdate(),
            defaults={
                'description': 'Practica academica de control de asistencia en la FCC.',
                'entry_time': timezone.now(),
                'status': Activity.Status.OPEN,
            }
        )

        sample_professor_name = PROFESSOR_NAMES[0] if PROFESSOR_NAMES else 'Profesor de ejemplo'
        Activity.objects.get_or_create(
            created_by=supervisor,
            lab=primary_lab,
            record_type=Activity.RecordType.PROFESSOR_REQUEST,
            student_code='SOL-PROF-001',
            first_name=sample_professor_name,
            last_name='',
            activity_date=timezone.localdate(),
            defaults={
                'description': 'Solicitud de uso extraordinario del salón registrada como ejemplo operativo.',
                'subject_name': 'Ingeniería de Software I',
                'nrc': '123456',
                'class_time': '10:00 - 12:00',
                'status': Activity.Status.PENDING,
            }
        )

        ComputerUsageRequest.objects.update_or_create(
            lab=primary_lab,
            student=student,
            requested_date=timezone.localdate(),
            start_time='09:00',
            defaults={
                'end_time': '10:00',
                'purpose': 'Practica academica en equipo de computo',
                'notes': 'Solicitud de ejemplo para demostracion del flujo estudiante-supervisor.',
                'status': ComputerUsageRequest.RequestStatus.PENDING,
            }
        )

        maker_lab = Lab.objects.filter(code='CCO3-114').first() or primary_lab
        innovation_lab = Lab.objects.filter(code='CCO4-206').first() or primary_lab

        IncidentReport.objects.update_or_create(
            lab=maker_lab,
            reported_by_name='Coordinación de laboratorios',
            description='Se detectó comportamiento irregular en el equipo instalado y se requiere revisión preventiva.',
            defaults={
                'severity': IncidentReport.Severity.HIGH,
                'status': IncidentReport.Status.IN_REVIEW,
                'created_by': admin,
            }
        )

        IncidentReport.objects.update_or_create(
            lab=innovation_lab,
            reported_by_name='Responsable de infraestructura',
            description='Se requiere mantenimiento preventivo del sistema eléctrico y revisión general del espacio.',
            defaults={
                'severity': IncidentReport.Severity.MEDIUM,
                'status': IncidentReport.Status.OPEN,
                'created_by': supervisor,
            }
        )

        self.stdout.write(self.style.SUCCESS('Demo data created successfully.'))
