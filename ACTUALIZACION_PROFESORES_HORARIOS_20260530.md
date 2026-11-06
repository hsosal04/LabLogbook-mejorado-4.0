# Actualización: catálogo de profesores para horarios

Se incorporó el directorio de personal docente de la Facultad de Ciencias de la Computación como catálogo de nombres para el módulo **Horarios de clase**.

## Cambios principales

- Se agregaron 143 nombres de profesores al catálogo interno `apps/accounts/fcc_professors.py`.
- Se omitieron los correos electrónicos del catálogo para evitar crear cuentas de usuario con correos predefinidos.
- El endpoint `GET /api/users/professors/` ahora devuelve opciones de profesores a partir del catálogo de nombres y de los profesores que se registren posteriormente.
- El módulo de horarios puede sugerir nombres de profesores mediante el campo de captura con lista desplegable.
- Se eliminaron de la base de datos local las cuentas de profesores creadas automáticamente como datos de demostración.
- Los profesores podrán registrarse posteriormente con su propio correo institucional desde el formulario de registro.

## Consideración operativa

El catálogo de profesores no equivale a cuentas de usuario. Su propósito es facilitar la captura de horarios de clase. Cuando un profesor necesite ingresar al sistema, deberá crear su cuenta con rol **Profesor** y capturar su correo institucional.
