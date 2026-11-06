# Actualización: horario de inicio y término en reserva de salón

Se ajustó el módulo `Reservar salón` del rol Profesor para que el formulario permita seleccionar de forma explícita:

- Fecha hábil de la semana actual.
- Hora de inicio.
- Hora de término.

La hora de término se muestra como menú desplegable y se calcula con base en la disponibilidad consecutiva del salón seleccionado. El sistema conserva la validación de lunes a viernes y rango operativo de 07:00 a 17:00.

También se ajustó el backend para aceptar reservas de uno o más bloques completos de una hora, siempre que no existan cruces con horarios de clase ni con solicitudes pendientes o aprobadas.
