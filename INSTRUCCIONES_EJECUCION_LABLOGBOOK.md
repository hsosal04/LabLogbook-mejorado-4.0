# Instrucciones de ejecución de LabLogbook

## Acceso administrador

La cuenta administradora queda reservada para iniciar sesión en el frontend y para entrar al panel de Django Admin.

- Usuario: `202058364`
- Contraseña: `yoga0401`
- Django Admin: `http://127.0.0.1:8000/admin/`
- Frontend Angular: `http://localhost:4200/`

## Ejecución rápida en Windows

Desde la carpeta principal del proyecto, ejecutar:

```bat
iniciar_sistema_windows.bat
```

Este archivo abre dos ventanas: una para Django y otra para Angular.

## Ejecución manual del backend

```bash
cd backend
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py ensure_admin
python manage.py seed_demo_data
python manage.py runserver 127.0.0.1:8000
```

## Ejecución manual del frontend

```bash
cd frontend
npm install
npm start
```

## Roles visibles en la aplicación

En el registro y en la gestión operativa de usuarios solo se muestran los siguientes roles:

- Estudiante
- Supervisor
- Profesor

El rol Administrador se conserva internamente para la cuenta principal del sistema y para el acceso a Django Admin, pero no aparece como opción de registro operativo.
