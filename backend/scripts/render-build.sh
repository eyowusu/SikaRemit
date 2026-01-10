#!/bin/bash

# Render Build Script for SikaRemit Backend
echo "Starting SikaRemit backend build..."

# Install dependencies
pip install -r requirements.txt

# Wait for database to be ready
echo "Waiting for database..."
python manage.py wait_for_db

# Run database migrations
echo "Running database migrations..."
python manage.py migrate --noinput

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Create superuser if needed (optional)
echo "Creating superuser..."
python -c "
import os
import django
from django.contrib.auth import get_user_model

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser(
        username='admin',
        email='admin@sikaremit.com',
        password=os.environ.get('ADMIN_PASSWORD', 'Admin123!')
    )
    print('Superuser created successfully')
else:
    print('Superuser already exists')
"

echo "Build completed successfully!"
