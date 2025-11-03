@echo off
cd /d "%~dp0.."
call venv\Scripts\activate
python manage.py process_scheduled_payouts
