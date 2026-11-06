from django.core.management.base import BaseCommand
from django.db import connection
from django.utils import timezone


class Command(BaseCommand):
    help = 'Repara la tabla labs_computerusagerequest si la base de datos local no la contiene.'

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            tables = connection.introspection.table_names(cursor)
            if 'labs_computerusagerequest' not in tables:
                cursor.execute('''
                    CREATE TABLE "labs_computerusagerequest" (
                        "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
                        "requested_date" date NOT NULL,
                        "start_time" time NOT NULL,
                        "end_time" time NOT NULL,
                        "purpose" varchar(160) NOT NULL,
                        "notes" text NOT NULL DEFAULT '',
                        "assigned_computer" varchar(80) NOT NULL DEFAULT '',
                        "status" varchar(20) NOT NULL DEFAULT 'PENDING',
                        "resolution_notes" text NOT NULL DEFAULT '',
                        "created_at" datetime NOT NULL,
                        "updated_at" datetime NOT NULL,
                        "lab_id" bigint NOT NULL REFERENCES "labs_lab" ("id") DEFERRABLE INITIALLY DEFERRED,
                        "reviewed_by_id" bigint NULL REFERENCES "accounts_user" ("id") DEFERRABLE INITIALLY DEFERRED,
                        "student_id" bigint NOT NULL REFERENCES "accounts_user" ("id") DEFERRABLE INITIALLY DEFERRED
                    )
                ''')
                cursor.execute('CREATE INDEX "labs_computerusagerequest_lab_id_idx" ON "labs_computerusagerequest" ("lab_id")')
                cursor.execute('CREATE INDEX "labs_computerusagerequest_reviewed_by_id_idx" ON "labs_computerusagerequest" ("reviewed_by_id")')
                cursor.execute('CREATE INDEX "labs_computerusagerequest_student_id_idx" ON "labs_computerusagerequest" ("student_id")')
                self.stdout.write(self.style.SUCCESS('Tabla labs_computerusagerequest creada.'))
            else:
                self.stdout.write(self.style.SUCCESS('La tabla labs_computerusagerequest ya existe.'))

            cursor.execute("SELECT 1 FROM django_migrations WHERE app=%s AND name=%s", ['labs', '0005_computerusagerequest'])
            if cursor.fetchone() is None:
                cursor.execute(
                    "INSERT INTO django_migrations(app, name, applied) VALUES(%s, %s, %s)",
                    ['labs', '0005_computerusagerequest', timezone.now()],
                )
                self.stdout.write(self.style.SUCCESS('Migración labs.0005_computerusagerequest marcada como aplicada.'))
            else:
                self.stdout.write(self.style.SUCCESS('La migración labs.0005_computerusagerequest ya está registrada.'))
