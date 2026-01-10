#!/bin/bash
cd /path/to/SikaRemit/backend
source venv/bin/activate
python manage.py process_scheduled_payouts
