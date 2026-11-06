# Actualización: reparación del módulo Solicitudes de computadora

Se corrigió la base de datos local incluida en el paquete para incorporar la tabla `labs_computerusagerequest`, utilizada por el endpoint:

`/api/labs/computer-requests/`

El error se producía porque el frontend intentaba consultar las solicitudes de computadora, pero la base de datos SQLite local no contenía la tabla correspondiente al modelo `ComputerUsageRequest`.

## Ajustes aplicados

- Se creó la tabla `labs_computerusagerequest` en `db.sqlite3`.
- Se registró la migración `labs.0005_computerusagerequest` como aplicada.
- Se agregó el comando de mantenimiento:

```bash
python manage.py repair_computer_requests_table
```

- Se mejoró el manejo de errores del frontend para evitar mostrar HTML completo de Django en alertas del navegador.

## Comandos recomendados

```bash
python manage.py repair_computer_requests_table
python manage.py migrate
python manage.py runserver
```
