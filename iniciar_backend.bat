@echo off
cd /d "%~dp0backend"
if not exist .env copy .env.example .env
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py ensure_admin
python manage.py seed_demo_data
python manage.py runserver 127.0.0.1:8000
pause
