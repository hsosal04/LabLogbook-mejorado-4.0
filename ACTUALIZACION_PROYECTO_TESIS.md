# Actualización del proyecto conforme a la tesis

Esta versión del proyecto fue ajustada para conservar coherencia con el documento de tesis de LabLogbook.

## Ajustes principales

- Se mantuvo la arquitectura Angular + Django + JWT descrita en la tesis.
- Se conservaron los módulos: autenticación, usuarios, asistencias, actividades, laboratorios, uso de salones, reportes y horario semanal.
- Se corrigió la configuración de arranque del frontend para Angular 19 usando el nombre explícito del proyecto.
- Se unificó el servicio de horarios para trabajar sobre el endpoint canónico `api/labs/class-schedules/`.
- Se agregó la interfaz `ClassScheduleEntry` como alias de compatibilidad para evitar errores de compilación en TypeScript.
- Se actualizó la documentación de ejecución y las credenciales de demostración.
- El paquete final se entrega limpio, sin `.venv`, `node_modules`, `.angular`, `db.sqlite3` ni archivos temporales.

## Alcance de la actualización

La actualización se centró en dejar el proyecto más consistente con la tesis y más apto para entrega académica y ejecución local desde código fuente.
