# Actualización: computadoras disponibles por salón/laboratorio

Se agregó un campo para registrar el número de computadoras disponibles en cada salón o laboratorio.

Cambios principales:

- Backend: nuevo campo `available_computers` en el modelo `Lab`.
- API: el campo se incluye en el serializador de laboratorios/salones.
- Base de datos: nueva migración `0007_lab_available_computers.py`.
- Frontend: el catálogo permite capturar y editar el número de computadoras disponibles.
- Frontend: las solicitudes de salón y de equipo muestran el número de computadoras disponibles del espacio seleccionado.

Después de actualizar, ejecutar en backend:

```bash
python manage.py migrate
```
