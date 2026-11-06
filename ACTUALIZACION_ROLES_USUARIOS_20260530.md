# Actualización de roles en el módulo de usuarios

Se ajustó el comportamiento del módulo de administración de usuarios para que el menú desplegable de cambio de rol aparezca únicamente en cuentas con rol **Estudiante** o **Supervisor**.

## Cambios realizados

- En el directorio de usuarios, los usuarios con rol **Estudiante** o **Supervisor** muestran un menú desplegable con solo dos opciones:
  - Estudiante
  - Supervisor
- Se eliminó la opción **Profesor** del menú desplegable de cambio de rol.
- Los usuarios con rol **Profesor** ya no muestran menú desplegable en la tabla de usuarios; únicamente se visualiza la etiqueta **Profesor**.
- En el formulario de edición del usuario seleccionado, el campo de rol solo es editable para usuarios Estudiante o Supervisor.
- Las cuentas de Profesor quedan protegidas frente al cambio manual de rol desde este módulo.

## Archivo modificado

- `frontend/src/app/features/users/users.component.ts`
