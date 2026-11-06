# Cambios realizados en esta actualización

## Ajustes para mejorar la concordancia con la tesis

- Se revisó la terminología del sistema para que los nombres de módulos y acciones sean más claros dentro del documento recepcional.
- Se unificó la redacción de la interfaz en español en los apartados clave del frontend.
- Se ajustó el módulo de reportes para que el botón del reporte de utilización exprese mejor su función real.
- Se incorporó una guía de correspondencia entre proyecto y tesis para facilitar la redacción del Capítulo 4 y del capítulo de resultados.
- Se precisó la documentación técnica para distinguir claramente entre lo implementado en esta versión local y lo proyectado para producción futura.

## Cambios funcionales y de presentación

### Backend
- Se mantiene la lógica de autenticación con JWT.
- Se mantienen los roles Administrador, Supervisor, Profesor y Estudiante.
- Se conservan las validaciones de una sola asistencia abierta por usuario.
- Se conservan las validaciones de hora de salida posterior a la hora de entrada.
- Se mantienen los módulos de actividades, laboratorios, uso de salones, reportes y horario semanal.
- Se tradujeron al español los mensajes principales de validación y permisos del backend para mejorar consistencia con el frontend y con la tesis.

### Frontend
- Se ajustó la redacción visible del módulo de laboratorios para presentarlo como catálogo y gestión de supervisores en español.
- Se ajustó la redacción visible del módulo de horarios para expresar su función como horario semanal de clases.
- Se ajustó la redacción visible del panel principal para mostrar alcances por rol en español.
- Se corrigieron mensajes de error en módulos de asistencias, reportes y uso de salones.
- En el módulo de reportes, el botón **“Actualizar utilización”** fue sustituido por **“Generar reporte de utilización”** para que la acción sea más comprensible y defendible dentro de la tesis.

## Documentación y empaque

- Se actualizó el archivo `README.md` en español y con terminología consistente con la tesis.
- Se agregó el archivo `GUIA_CONCORDANCIA_TESIS.md` como apoyo para la explicación académica del proyecto.
- Se recomienda distribuir el proyecto sin carpetas pesadas del entorno local (`node_modules`, `.venv`, `.angular`, `__pycache__`).
