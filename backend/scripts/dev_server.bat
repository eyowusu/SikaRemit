@echo off
REM Django Development Server Auto-Restart for Windows
REM This script automatically restarts the Django development server if it crashes

:restart
echo Starting Django development server...
python manage.py runserver 8000
echo Server stopped, restarting in 2 seconds...
timeout /t 2 /nobreak > nul
goto restart
