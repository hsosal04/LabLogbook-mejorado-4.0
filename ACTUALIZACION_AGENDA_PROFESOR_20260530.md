# Actualización: agenda de reservas para profesor

Se ajustó el módulo **Reservar salón** para el rol **Profesor**.

## Cambios aplicados

1. La agenda de disponibilidad ahora muestra únicamente días hábiles:
   - Lunes
   - Martes
   - Miércoles
   - Jueves
   - Viernes

2. Se eliminaron sábado y domingo de la cuadrícula principal de disponibilidad.

3. El horario disponible para seleccionar se ajustó a bloques de una hora entre:
   - 07:00
   - 17:00

4. El backend valida que las solicitudes del profesor solo puedan generarse:
   - Dentro de la semana laboral actual.
   - De lunes a viernes.
   - En horas cerradas.
   - En bloques de una hora.
   - Sin invadir horarios de clase ya registrados.
   - Sin invadir reservas previamente aprobadas o pendientes.

5. Se actualizaron los textos de la interfaz para indicar que se trata de una agenda laboral de lunes a viernes.

## Archivos modificados

- `frontend/src/app/features/classrooms/classrooms.component.ts`
- `backend/apps/labs/views.py`
- `backend/apps/labs/serializers.py`
