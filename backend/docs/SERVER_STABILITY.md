# Django Development Server Improvements

## Current Issues
- Django development server (`runserver`) occasionally stops unexpectedly
- No automatic restart on code changes
- No process monitoring

## Recommended Solutions

### Option 1: Use Django Extensions + Werkzeug (Recommended)

1. Install django-extensions:
   ```bash
   pip install django-extensions Werkzeug
   ```

2. Update `INSTALLED_APPS` in `core/settings.py`:
   ```python
   INSTALLED_APPS = [
       # ... existing apps ...
       'django_extensions',
   ]
   ```

3. Run with auto-restart:
   ```bash
   python manage.py runserver_plus --cert-file /tmp/cert.crt
   ```

### Option 2: Use Gunicorn with auto-restart

1. Install gunicorn:
   ```bash
   pip install gunicorn
   ```

2. Create a development script:
   ```bash
   # scripts/dev_server.py
   #!/usr/bin/env python
   import subprocess
   import time
   import signal
   import sys
   from pathlib import Path

   def run_server():
       while True:
           print("Starting Django development server...")
           process = subprocess.Popen([
               sys.executable, 'manage.py', 'runserver', '8000'
           ], cwd=Path(__file__).parent.parent)

           try:
               process.wait()
           except KeyboardInterrupt:
               process.terminate()
               break

           print("Server stopped, restarting in 2 seconds...")
           time.sleep(2)

   if __name__ == '__main__':
       run_server()
   ```

3. Run the development script:
   ```bash
   python scripts/dev_server.py
   ```

### Option 3: Use Docker with auto-restart

1. Create a `docker-compose.yml` for development:
   ```yaml
   version: '3.8'
   services:
     web:
       build: .
       command: python manage.py runserver 0.0.0.0:8000
       volumes:
         - .:/app
       ports:
         - "8000:8000"
       environment:
         - DJANGO_SETTINGS_MODULE=core.settings
       restart: unless-stopped
   ```

2. Run with Docker:
   ```bash
   docker-compose up --build
   ```

## Quick Fix for Current Setup

For immediate improvement, add this to your development workflow:

```bash
# In a separate terminal, monitor and restart server
while true; do
    python manage.py runserver 8000
    echo "Server crashed, restarting in 2 seconds..."
    sleep 2
done
```

## Environment-Specific Settings

Add to `core/settings.py`:

```python
if DEBUG:
    # Development-specific settings
    INSTALLED_APPS.append('django_extensions')

    # Auto-reload settings
    FILE_UPLOAD_MAX_MEMORY_SIZE = 104857600  # 100MB for development
    DATA_UPLOAD_MAX_MEMORY_SIZE = 104857600
```

## Monitoring

Consider adding health checks:

```python
# Add to core/urls.py
from django.http import JsonResponse

def health_check(request):
    return JsonResponse({'status': 'ok'})

urlpatterns = [
    # ... existing patterns ...
    path('health/', health_check, name='health_check'),
]
```

This will help identify when the server stops responding.
