# Actualización de imágenes institucionales

Se incorporaron recursos visuales institucionales al frontend de LabLogbook para mejorar la presentación de la aplicación durante la demostración del proyecto de tesis.

## Cambios realizados

1. Se agregó el logotipo de BUAP como fondo y elemento visual en las pantallas de inicio de sesión y registro.
2. Se agregó el logotipo de la Facultad de Ciencias de la Computación en la barra lateral del sistema, visible para los cuatro roles de usuario: administrador, supervisor, profesor y estudiante.
3. Se agregó la imagen del edificio de la Facultad de Ciencias de la Computación como fondo general del área interna de la aplicación.
4. Se agregó una imagen de computadora como fondo visual del módulo de solicitudes de computadora, utilizado por estudiante, administrador y supervisor.
5. Se conservaron los estilos de tarjetas semitransparentes para mantener legibilidad sobre los fondos institucionales.

## Archivos modificados

- frontend/src/app/features/auth/login.component.ts
- frontend/src/app/features/auth/register.component.ts
- frontend/src/app/layout/app-shell.component.ts
- frontend/src/app/features/computer-requests/computer-requests.component.ts
- frontend/src/styles.css

## Recursos agregados

- frontend/public/assets/images/buap-logo.png
- frontend/public/assets/images/fcc-logo.png
- frontend/public/assets/images/fcc-building.jpg
- frontend/public/assets/images/computer-bg.png
