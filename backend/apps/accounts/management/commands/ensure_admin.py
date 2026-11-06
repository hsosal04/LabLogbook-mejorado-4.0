from django.core.management.base import BaseCommand
from apps.accounts.models import User


class Command(BaseCommand):
    help = 'Crea o actualiza la cuenta administradora principal de LabLogbook.'

    def add_arguments(self, parser):
        parser.add_argument('--username', default='202058364')
        parser.add_argument('--password', default='yoga0401')
        parser.add_argument('--email', default='admin@lablogbook.edu')
        parser.add_argument('--student-code', default='202058364')

    def handle(self, *args, **options):
        username = options['username']
        password = options['password']
        email = options['email']
        student_code = options['student_code']

        user, _ = User.objects.get_or_create(
            username=username,
            defaults={
                'email': email,
                'institutional_email': email,
                'student_code': student_code,
                'first_name': 'Administrador',
                'last_name': 'LabLogbook',
                'department': 'FCC',
                'role': User.Role.ADMIN,
                'status': User.Status.ACTIVE,
            },
        )
        user.email = email
        user.institutional_email = email
        user.student_code = student_code
        user.role = User.Role.ADMIN
        user.status = User.Status.ACTIVE
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.set_password(password)
        user.save()
        self.stdout.write(self.style.SUCCESS(f'Administrador listo: usuario={username}, contraseña={password}'))
