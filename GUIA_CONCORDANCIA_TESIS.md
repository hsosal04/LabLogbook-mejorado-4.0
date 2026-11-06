# Guía de concordancia entre el proyecto y la tesis

Este documento sirve como apoyo para explicar de forma clara cómo el proyecto LabLogbook respalda técnicamente el contenido de la tesis.

## 1. Resumen del proyecto

LabLogbook es una aplicación web para el control digital de:

- bitácoras operativas,
- asistencias,
- actividades,
- laboratorios,
- uso de salones,
- reportes,
- horario semanal de clases.

Su arquitectura está organizada en frontend Angular y backend Django REST Framework, con autenticación JWT y persistencia local en SQLite.

## 2. Correspondencia sugerida con la tesis

### Capítulo 1. Marco teórico y contextual
Se respalda con la lógica general del sistema y con la necesidad real de sustituir registros manuales por una solución web centralizada.

### Capítulo 2. Planteamiento del problema
El proyecto refleja directamente la problemática descrita en la tesis:
- registros manuales dispersos,
- dificultad de consulta histórica,
- necesidad de trazabilidad,
- control de acceso por roles,
- administración de laboratorios, salones y horarios.

### Capítulo 3. Objetivos, metodología y planeación
Los módulos del sistema permiten demostrar que los objetivos no son solamente teóricos, sino que se traducen en componentes concretos del software.

### Capítulo 4. Implementación y desarrollo del sistema
Este es el capítulo que más se relaciona con el proyecto. Los apartados pueden explicarse así:

- **Autenticación:** `frontend/src/app/features/auth/` y endpoints de `backend/apps/accounts/`
- **Usuarios y roles:** `frontend/src/app/features/users/` y `backend/apps/accounts/`
- **Asistencias:** `frontend/src/app/features/attendance/` y `backend/apps/attendance/`
- **Actividades:** `frontend/src/app/features/activities/` y `backend/apps/activities/`
- **Laboratorios:** `frontend/src/app/features/labs/` y `backend/apps/labs/`
- **Uso de salones:** `frontend/src/app/features/classrooms/` y `backend/apps/labs/`
- **Reportes:** `frontend/src/app/features/reports/` y `backend/apps/reports/`
- **Horario semanal:** `frontend/src/app/features/schedules/` y `backend/apps/labs/`

### Capítulo 5. Resultados, evidencias y validación
Para este capítulo, las evidencias recomendables son:

- inicio de sesión,
- panel principal,
- formulario de asistencias,
- registro de actividades,
- uso de salones,
- catálogo de laboratorios,
- reporte de asistencias,
- reporte de utilización,
- horario semanal de clases.

## 3. Aclaraciones importantes para la tesis

### Base de datos
La tesis debe expresar con precisión que:
- la versión entregada funciona con **SQLite** en entorno local;
- **MySQL** puede presentarse como proyección para producción;
- **Firestore/Firebase** no es la base activa del sistema en esta entrega.

### Reportes
En la interfaz, el módulo de reportes ya distingue:
- **Reporte de asistencias**, con filtros y generación manual;
- **Reporte de utilización**, resumido por laboratorio a partir de asistencias cerradas.

### Roles
El sistema contempla cuatro roles:
- Administrador,
- Supervisor,
- Profesor,
- Estudiante.

Cada uno tiene un alcance distinto, lo cual ayuda a sostener en la tesis el apartado de seguridad y control por roles.

## 4. Redacción sugerida para defender el proyecto

Se puede afirmar que el proyecto sí implementa los módulos centrales descritos en la tesis y que la evidencia funcional principal se encuentra en la estructura cliente-servidor, en el control por roles, en las validaciones de negocio y en las interfaces de operación para asistencias, actividades, laboratorios, uso de salones, reportes y horarios.

También conviene aclarar que esta versión está preparada para demostración local y documentación académica, por lo que algunos elementos planteados como escalamiento a producción permanecen como proyección futura y no como parte operativa principal de la entrega actual.
