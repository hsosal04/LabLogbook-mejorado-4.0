# Actualización aplicada al proyecto LabLogbook

## Cambios realizados

1. **Registro público habilitado para profesores**
   - Se agregó el rol **Profesor** en la pantalla `Registrar usuario`.
   - El backend ya no bloquea el auto-registro de profesores; únicamente mantiene restringida la creación pública de cuentas **Administrador**.

2. **Usuario generado con la matrícula**
   - En el registro público y en la creación de usuarios desde el módulo de administración, el campo `username` ya no se captura manualmente.
   - El sistema asigna automáticamente la **matrícula** como nombre de usuario.
   - Se conserva la validación de matrícula de **9 dígitos** y se verifica que no se repita como usuario.

3. **Ocultamiento del correo institucional de profesores**
   - En el directorio de usuarios del frontend, el correo institucional de cuentas con rol **Profesor** se muestra como `Oculto`.
   - En el panel de administración de Django también se enmascara la columna de correo institucional para profesores.

## Archivos principales actualizados

### Frontend
- `frontend/src/app/features/auth/register.component.ts`
- `frontend/src/app/features/users/users.component.ts`

### Backend
- `backend/apps/accounts/serializers.py`
- `backend/apps/accounts/views.py`
- `backend/apps/accounts/admin.py`

## Nota operativa

Después de descomprimir el proyecto, ejecute nuevamente:

### Backend
```bat
cd backend
.venv\Scriptsctivate
pip install -r requirements.txt
python manage.py runserver
```

### Frontend
```bat
cd frontend
npm install
npm start
```
