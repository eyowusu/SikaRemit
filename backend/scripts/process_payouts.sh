#!/bin/bash
cd /path/to/PayGlobe/backend
source venv/bin/activate
python manage.py process_scheduled_payouts
