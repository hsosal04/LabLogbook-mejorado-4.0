# Actualización: flujo de solicitudes de salón corregido

Se corrigió el flujo para que las solicitudes de salón generadas por profesores se concentren en el módulo **Solicitudes de salón**, visible para los roles **Administrador** y **Supervisor**.

## Cambios principales

1. El menú **Actividades** queda reservado para Administrador y Supervisor, enfocado en el registro de ingreso de alumnos.
2. El rol Profesor debe usar el módulo **Reservar salón** para generar solicitudes formales de uso o cambio de salón.
3. Las solicitudes creadas en **Reservar salón** se almacenan en el modelo `ClassroomUsage` y aparecen en **Solicitudes de salón** para aprobación o rechazo.
4. Se agregó el comando:

```bash
python manage.py sync_professor_classroom_requests
```

Este comando migra solicitudes antiguas del profesor que fueron capturadas por error en el módulo **Actividades**, para que también aparezcan en **Solicitudes de salón**.

## Flujo final esperado

Profesor → Reservar salón → Solicitud pendiente → Administrador/Supervisor → Solicitudes de salón → Aprobar o rechazar.
