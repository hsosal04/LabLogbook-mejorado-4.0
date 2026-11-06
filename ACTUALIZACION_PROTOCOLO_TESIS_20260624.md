# Actualización alineada al protocolo de tesis

Esta versión de LabLogbook fue ajustada para coincidir con el protocolo de tesis actualizado.

## Cambios principales

- Se actualizó la redacción visible de la aplicación para reforzar el enfoque del protocolo: gestión digital de bitácoras, asistencias, actividades, percances, laboratorios, salones y solicitudes académicas.
- Se conservaron los cuatro roles operativos: Administrador, Supervisor, Profesor y Alumno.
- Se mantuvieron los flujos funcionales de solicitudes de salón para profesores y solicitudes de equipo de cómputo para alumnos.
- Se actualizaron textos de panel principal, pantalla inicial, registro, reportes y solicitudes para que el sistema tenga mayor concordancia con el documento de protocolo.
- Se conservó la arquitectura Angular 19 + Django 5 + Django REST Framework + SQLite.
- Se conservaron las imágenes institucionales y fondos visuales previamente integrados.

## Imágenes respetadas

Las imágenes continúan en la ruta:

```text
frontend/public/assets/images/
```

Archivos conservados:

- `buap-logo.png`
- `fcc-logo.png`
- `fcc-building.jpg`
- `computer-bg.png`

Los estilos siguen apuntando a estas imágenes desde `frontend/src/styles.css`, por lo que no se reemplazaron ni eliminaron los fondos configurados anteriormente.

## Nota técnica

Los nombres internos de modelos, servicios y endpoints pueden conservar términos técnicos en inglés como `IncidentReport` o `/reports/incidents/`, ya que forman parte de la estructura del backend. Los cambios de esta actualización se enfocan en la concordancia visual y textual con el protocolo sin romper la lógica existente de la aplicación.
