# Actualización: corrección de reserva de salón por profesor

Se corrigió el flujo de creación de solicitudes de salón en el rol Profesor.

## Problema detectado
Al enviar una solicitud desde el módulo **Reservar salón**, el backend devolvía el error:

```text
{ "professor": ["Este campo es requerido."] }
```

Esto ocurría porque el serializador de `ClassroomUsage` todavía esperaba recibir el campo `professor` desde el frontend, aunque dicho dato debe asignarse automáticamente con el usuario autenticado.

## Ajuste realizado
El campo `professor` se dejó como dato de solo lectura en el serializador y el backend lo asigna mediante `serializer.save(professor=request.user, status='PENDING')`.

## Resultado
El profesor puede registrar la solicitud indicando únicamente salón, materia, fecha, hora de inicio, hora de término y observaciones. La solicitud queda en estado `PENDING` para que posteriormente sea revisada por Administrador o Supervisor en el módulo **Solicitudes de salón**.
