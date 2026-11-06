# Actualización: solicitudes de salón para administrador y supervisor

Se agregó el apartado **Solicitudes de salón** para los roles **Administrador** y **Supervisor**.

## Cambios funcionales

- El profesor conserva el módulo **Reservar salón** para generar solicitudes de uso o cambio de salón.
- Las solicitudes del profesor ahora se registran inicialmente en estado **Pendiente**.
- El administrador puede consultar todas las solicitudes de salón.
- El supervisor puede consultar las solicitudes correspondientes a los laboratorios o salones que tiene asignados.
- Administrador y supervisor pueden **aprobar** o **rechazar** cada solicitud.
- Se agregó campo de observación de resolución para documentar la decisión.

## Cambios técnicos

- Se habilitaron los endpoints de aprobación y rechazo en `ClassroomUsageViewSet`.
- Se agregó `resolution_notes` al modelo `ClassroomUsage`.
- Se creó la migración `0006_classroomusage_resolution_notes.py`.
- Se agregó la ruta frontend `/app/classroom-requests`.
- Se creó el componente `classroom-requests.component.ts`.
- Se agregó la opción de menú **Solicitudes de salón** para administrador y supervisor.

## Flujo resultante

1. El profesor genera una solicitud de salón.
2. El sistema la registra como pendiente.
3. El administrador o supervisor revisa la solicitud.
4. El administrador o supervisor aprueba o rechaza la solicitud.
5. El sistema conserva el estado y la observación de resolución.
