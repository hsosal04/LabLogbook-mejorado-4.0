# Actualización: solicitud de uso de computadora

Se agregó un módulo para que el rol Estudiante pueda solicitar el uso de una computadora en un laboratorio o salón.

## Flujo implementado

1. El estudiante genera una solicitud indicando espacio, fecha, horario, motivo y observaciones.
2. La solicitud queda en estado Pendiente.
3. El administrador o supervisor revisa la solicitud.
4. El administrador o supervisor puede aprobar, rechazar o finalizar la solicitud.
5. Para aprobar, debe asignar una computadora específica.

## Reglas de validación

- Solo se permiten solicitudes de lunes a viernes.
- El horario permitido es de 07:00 a 17:00.
- No se permiten fechas anteriores al día actual.
- El estudiante no asigna directamente el equipo.
- La asignación queda bajo control de administrador o supervisor.

## Archivos modificados

- `backend/apps/labs/models.py`
- `backend/apps/labs/serializers.py`
- `backend/apps/labs/views.py`
- `backend/apps/labs/urls.py`
- `backend/apps/labs/admin.py`
- `frontend/src/app/core/models/models.ts`
- `frontend/src/app/core/services/labs.service.ts`
- `frontend/src/app/app.routes.ts`
- `frontend/src/app/layout/app-shell.component.ts`
- `frontend/src/app/features/computer-requests/computer-requests.component.ts`
