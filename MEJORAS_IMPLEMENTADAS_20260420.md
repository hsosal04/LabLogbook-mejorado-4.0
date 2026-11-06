# Mejoras implementadas en LabLogbook (20-04-2026)

## Cambios aplicados al proyecto

1. **Autenticación por correo o matrícula**
   - El backend ahora permite iniciar sesión con correo institucional, correo alterno, usuario o matrícula.
   - El frontend actualizó la vista de acceso para reflejar este cambio.

2. **Validación de matrícula de 9 dígitos**
   - Se agregó validación en backend y frontend para aceptar únicamente matrículas numéricas de 9 dígitos.

3. **Validación estricta de correos**
   - Se reforzó la validación de correos electrónicos.
   - Se impide repetir el mismo correo entre `email`, `institutional_email` y `alternate_email`.
   - También se impide reutilizar un correo ya asignado a otra cuenta.

4. **Restricción de caracteres por campo**
   - Se añadieron sanitización y validaciones para usuario, nombres, departamento, NRC, clave de materia, sección, nombre de profesor, códigos de laboratorio y otros campos relevantes.

5. **Reportes con validación de fechas**
   - Se valida que la fecha inicial y la final sean válidas.
   - Se bloquean fechas futuras.
   - Se valida que la fecha final no sea anterior a la inicial.
   - La validación existe en frontend y backend.

6. **Recomendaciones de contraseña en la página principal**
   - Se agregaron recomendaciones visibles dentro del panel principal.

7. **Se eliminó el acceso al apartado de asistencias desde la navegación**
   - Se retiró la ruta del menú y la navegación visible del módulo de asistencias.

8. **Reportes solo para administradores y supervisores**
   - El acceso al módulo de reportes quedó restringido por ruta y por backend.

9. **Uso de salones solo para profesores**
   - El acceso al módulo quedó limitado al rol profesor.
   - Se simplificó el flujo para que el profesor gestione únicamente sus propias reservaciones.

10. **Directorio de usuarios con filtro y búsqueda por nombre/matrícula**
    - Se añadió búsqueda local y paginación.

11. **Paginación en tablas**
    - Se incorporó paginación con opciones de 10 y 20 registros por página en módulos principales con tablas visibles:
      - Usuarios
      - Laboratorios
      - Actividades
      - Uso de salones
      - Reportes de asistencia
      - Reportes de utilización

12. **Lista de profesores sin exponer correo**
    - El endpoint de profesores ahora devuelve únicamente información mínima para selección.
    - Se dejó de exponer el correo del profesor en el listado usado por horarios y reservaciones.

13. **Horarios con saneamiento de captura**
    - Se reforzó la validación y sanitización de NRC, clave de materia, sección, nombre del profesor y notas.
    - Se agregó validación para evitar celdas repetidas en la operación de guardado masivo.

## Puntos interpretados de forma conservadora

- **“Quitar roles y correo electrónico repetido”** se atendió mediante validación para impedir correos repetidos y reduciendo la exposición innecesaria del correo en la lista de profesores.
- **“Quitar usuarios del apartado de usuarios”** no se eliminó por completo el módulo, porque otros puntos del requerimiento pedían buscar, filtrar y paginar el directorio. Se mantuvo el módulo y se mejoró su funcionamiento.
- **“Quitar el apartado repetido de NRC”** se interpretó como reforzar la captura para evitar duplicidades de celdas y mejorar el saneamiento del NRC. La estructura visual base del horario semanal se conservó.

## Verificación realizada

- `python manage.py check` en backend: **correcto**.
- `tsc --noEmit` en frontend: **correcto**.

## Observación

No fue posible ejecutar un `ng build` completo dentro del contenedor porque `node_modules` proviene de Windows y contiene binarios de `esbuild` incompatibles con Linux. Sin embargo, la verificación TypeScript del frontend sí finalizó correctamente.
