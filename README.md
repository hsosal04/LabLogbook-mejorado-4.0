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
- **Persistencia local:** SQLite
- **Persistencia en producción:** Postgres en Render
- **Persistencia prevista a futuro:** MySQL en un escenario de producción
- **Integración opcional preparada:** adaptador base para Firestore/Firebase, no activo en esta versión local

## Despliegue

- Frontend: https://lablogbook-six.vercel.app
- Backend: https://lablogbook-backend.onrender.com
- Base de datos en producción: Postgres en Render
- Base de datos local: SQLite

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
