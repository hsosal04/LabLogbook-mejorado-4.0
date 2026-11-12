# LabLogbook

Aplicación web para la gestión digital de bitácoras, asistencias, actividades, percances, laboratorios, salones y solicitudes académicas de la Facultad de Ciencias de la Computación.

Esta versión está alineada con el protocolo de tesis actualizado: conserva el enfoque por roles (Administrador, Supervisor, Profesor y Alumno), mantiene los flujos de solicitudes de salón y equipo de cómputo, y respeta los fondos institucionales configurados previamente.


LabLogbook es una aplicación web orientada al **control digital de bitácoras, asistencias, actividades, laboratorios, uso de salones y horario semanal de clases** dentro de un contexto universitario.

## Propósito del proyecto

El sistema fue organizado para que **coincida con la redacción de la tesis** y permita identificar con claridad sus módulos, su arquitectura y su funcionamiento real. La solución centraliza el registro de información operativa y aplica control de acceso por roles para mejorar la trazabilidad, la consulta histórica y la supervisión académica y administrativa.

## Arquitectura implementada

- **Frontend:** Angular (aplicación standalone)
- **Backend:** Django + Django REST Framework
- **Autenticación:** JSON Web Token (JWT)
- **Persistencia activa en esta entrega:** SQLite
- **Persistencia prevista a futuro:** MySQL en un escenario de producción
- **Integración opcional preparada:** adaptador base para Firestore/Firebase, no activo en esta versión local

## Roles contemplados

- **Administrador**
- **Supervisor de laboratorio**
- **Profesor**
- **Estudiante**

## Módulos funcionales incluidos

- Autenticación e inicio de sesión
- Gestión de usuarios y roles
- Catálogo de laboratorios
- Registro y cierre de asistencias
- Registro de actividades
- Uso y reservación de salones
- Reporte de asistencias
- Reporte de utilización
- Horario semanal de clases por salón
- Perfil del usuario

## Correspondencia con la tesis

Para facilitar la explicación del proyecto dentro del documento recepcional, se incluye el archivo:

- **GUIA_CONCORDANCIA_TESIS.md**

En ese archivo se indica qué módulo del sistema respalda cada sección importante de la tesis y qué elementos conviene mencionar como evidencia técnica.

## Ejecución del backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py sync_professor_classroom_requests
python manage.py ensure_admin
python manage.py seed_demo_data
python manage.py runserver 127.0.0.1:8000
```

Backend base:

```text
http://127.0.0.1:8000/admin/
```

## Ejecución del frontend

```bash
cd frontend
npm install
npm start
ng serve --host 0.0.0.0
```



## Nota para Angular 19

Los scripts del frontend ya quedaron definidos con el nombre explícito del proyecto (`lablogbook-frontend`) para evitar errores de arranque relacionados con la resolución del workspace en algunas instalaciones de Angular CLI.

Frontend base:

```text
http://localhost:4200
```

## Usuarios de demostración

Después de ejecutar `seed_demo_data`, se generan cuentas de ejemplo:

- `admin` / `yoga0401`
- `supervisor` / `yoga0401`
- `student` / `yoga0401`
- `primer profesor cargado por seed_demo_data` / `yoga0401`

## Endpoints principales

- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `POST /api/auth/refresh/`
- `GET /api/auth/me/`
- `GET /api/users/`
- `GET /api/users/professors/`
- `GET /api/labs/`
- `POST /api/labs/`
- `GET /api/attendance/`
- `POST /api/attendance/`
- `PATCH /api/attendance/{id}/close/`
- `GET /api/activities/`
- `POST /api/activities/`
- `GET /api/labs/classroom-usage/`
- `POST /api/labs/classroom-usage/`
- `POST /api/labs/classroom-usage/{id}/approve/`
- `POST /api/labs/classroom-usage/{id}/reject/`
- `GET /api/reports/attendance-by-lab/`
- `GET /api/reports/utilization/`
- `GET /api/labs/class-schedules/`
- `POST /api/labs/class-schedules/bulk_upsert/`

## Nota técnica importante

Esta entrega está preparada para **demostración local y documentación de tesis**. Por ello:

- el funcionamiento principal está respaldado por **Django ORM + SQLite**;
- la referencia a **MySQL** corresponde a un posible entorno de producción futuro;
- la referencia a **Firestore/Firebase** corresponde a una posibilidad de integración posterior y **no constituye la base activa del sistema en esta versión**.

## Empaquetado recomendado

Para entregas académicas, se recomienda distribuir el proyecto **sin** `node_modules`, `.venv`, `.angular`, `__pycache__` y demás archivos temporales, ya que el código fuente, los archivos de configuración y las dependencias declaradas son suficientes para reconstruir el entorno.

## Ajuste de ejecución y roles visibles

Esta versión incluye scripts de arranque para backend y frontend, además de un comando de administración para crear o restaurar la cuenta principal del sistema.

### Cuenta administradora

- Usuario: `202058364`
- Contraseña: `yoga0401`
- Django Admin: `http://127.0.0.1:8000/admin/`
- Frontend: `http://localhost:4200/`

El rol `ADMIN` se conserva para acceso interno, gestión del sistema y panel de Django. En los formularios operativos solo se muestran los roles `Estudiante`, `Supervisor` y `Profesor`.

### Ejecución rápida en Windows

```bat
iniciar_sistema_windows.bat
```

### Ejecución manual

Backend:

```bash
cd backend
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py ensure_admin
python manage.py seed_demo_data
python manage.py runserver 127.0.0.1:8000
```

Frontend:

```bash
cd frontend
npm install
npm start
```
