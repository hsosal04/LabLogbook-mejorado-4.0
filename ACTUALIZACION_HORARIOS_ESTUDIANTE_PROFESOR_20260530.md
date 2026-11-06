# Actualización de selección de horarios para estudiante y profesor

## Cambios aplicados

1. **Rol Estudiante - Solicitar computadora**
   - La hora de inicio y la hora de término ahora se capturan mediante controles editables de tipo `time`.
   - El estudiante puede especificar hora y minutos dentro del intervalo permitido de 07:00 a 17:00.
   - El sistema conserva la validación de días hábiles y evita horarios fuera del rango permitido.

2. **Rol Profesor - Reservar salón**
   - La selección de fecha y hora se cambió a controles desplegables.
   - El profesor selecciona primero un día hábil de la semana actual.
   - Después selecciona un bloque horario disponible.
   - La hora de término se calcula automáticamente con duración de una hora.
   - Los bloques disponibles se mantienen únicamente de lunes a viernes y de 07:00 a 17:00.

3. **Backend**
   - Se ajustó la validación de solicitudes de computadora para permitir minutos en el horario.
   - Se conserva la restricción de uso dentro de días hábiles y dentro del rango 07:00 a 17:00.
   - Las reservas de salón de profesor se mantienen en bloques cerrados de una hora para conservar control de disponibilidad.

## Observación metodológica

Esta actualización fortalece la coherencia operativa del sistema: el estudiante puede solicitar equipos con mayor precisión horaria, mientras que el profesor conserva una reserva estructurada por bloques, adecuada para salones y horarios institucionales.
