"""
Test settings for SikaRemit Django project.
Uses SQLite for faster testing instead of PostgreSQL.
"""

from .settings import *

# Use SQLite for testing
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'test_db.sqlite3',
        'ATOMIC_REQUESTS': False,
    }
}

# Disable debug for tests
DEBUG = False

# Use faster password hasher for tests
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# Disable email sending in tests
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

# Use in-memory cache for tests
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

# Dummy accounting config for tests
ACCOUNTING_CONFIG = {
    'system': 'disabled',  # Disable accounting sync during tests
}

# Compliance settings for tests
COMPLIANCE_REPORTING_ENABLED = False
