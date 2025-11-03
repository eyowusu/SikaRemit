from pathlib import Path
import os
import psycopg2
from psycopg2 import extensions
from datetime import timedelta
from django.utils.module_loading import import_string
from django.core.exceptions import ImproperlyConfigured
from decimal import Decimal

BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-generated-secret-key-here')

DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '').split(',') if os.environ.get('ALLOWED_HOSTS') else []

# Add Render's internal domains and localhost for development
if not DEBUG:
    RENDER_EXTERNAL_URL = os.environ.get('RENDER_EXTERNAL_URL')
    if RENDER_EXTERNAL_URL:
        ALLOWED_HOSTS.append(RENDER_EXTERNAL_URL.replace('https://', '').replace('http://', ''))
    ALLOWED_HOSTS.extend([
        'payglobe-backend.onrender.com',
        'payglobe-frontend.onrender.com',
    ])
else:
    ALLOWED_HOSTS.extend(['localhost', '127.0.0.1', '0.0.0.0'])

# CORS and CSRF settings
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_CREDENTIALS = True

# Handle CORS allowed origins from environment
cors_origins = os.environ.get('CORS_ALLOWED_ORIGINS', '')
if cors_origins:
    CORS_ALLOWED_ORIGINS = [origin.strip() for origin in cors_origins.split(',') if origin.strip()]
else:
    CORS_ALLOWED_ORIGINS = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
    ]
    if not DEBUG:
        CORS_ALLOWED_ORIGINS.extend([
            'https://payglobe-frontend.onrender.com',
        ])

# Additional CORS settings
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'x-csrftoken',
    'x-xsrf-token',
]

CORS_EXPOSE_HEADERS = [
    'content-type',
    'x-csrftoken',
]

CORS_PREFLIGHT_MAX_AGE = 86400  # 24 hours

# CSRF settings
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_USE_SESSIONS = False
CSRF_COOKIE_SECURE = not DEBUG
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]

INSTALLED_APPS = [
    'admin_interface',
    'colorfield',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'drf_spectacular',
    'csp',
    'accounts',
    'users',
    'merchants',
    'payments',
    'dashboard',
    'notifications',
    'channels',
    'compliance',
    'zxcvbn',
    'celery',  # Added Celery to installed apps
    'fcm_django',  # Added FCM to installed apps
    'core',  # Added core app to INSTALLED_APPS
    'django_extensions',  # Added for development utilities
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # CORS middleware should be as high as possible
    'core.middleware.RateLimitMiddleware',
    'core.middleware.RequestLogMiddleware',
    'shared.middleware.SecurityHeadersMiddleware',
    'csp.middleware.CSPMiddleware',
    'shared.middleware.RequestIDMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'core.middleware.ConnectionCheckMiddleware',  # Added here
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'accounts.middleware.AdminActivityMiddleware',  # Moved after authentication
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

ASGI_APPLICATION = 'core.asgi.application'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [os.environ.get('REDIS_URL', 'redis://localhost:6379/0')],
        },
    },
}

WSGI_APPLICATION = 'core.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'payglobe'),
        'USER': os.environ.get('DB_USER', 'postgres'),
        'PASSWORD': os.environ.get('DB_PASSWORD', ''),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
        'DISABLE_SERVER_SIDE_CURSORS': True,
        'CONN_MAX_AGE': 300,
    }
}

# Use DATABASE_URL if provided (Render's format)
DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL:
    import dj_database_url
    DATABASES['default'] = dj_database_url.config(
        default=DATABASE_URL,
        conn_max_age=300,
        ssl_require=True
    )

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'accounts.validators.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 10,
        }
    },
    {
        'NAME': 'accounts.validators.ComplexityValidator',
    },
    {
        'NAME': 'accounts.validators.DisallowCommonPasswordsValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
    {
        'NAME': 'accounts.validators.ZxcvbnValidator',
        'OPTIONS': {
            'min_score': 3,
        }
    },
]

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'payments/static'),
]

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# File upload permissions
FILE_UPLOAD_PERMISSIONS = 0o644
FILE_UPLOAD_DIRECTORY_PERMISSIONS = 0o755

# Media settings for KYC
KYC_MEDIA_URL = '/kyc-media/'
KYC_MEDIA_ROOT = os.path.join(BASE_DIR, 'kyc-media')

# Webhook config
KYC_WEBHOOK_URL = os.environ.get('KYC_WEBHOOK_URL')
KYC_WEBHOOK_SECRET = os.environ.get('KYC_WEBHOOK_SECRET')

# Biometric config
BIOMETRIC_API_KEY = os.environ.get('BIOMETRIC_API_KEY')
BIOMETRIC_MIN_MATCH_SCORE = 0.85  # Required face match score
BIOMETRIC_MIN_LIVENESS = 0.9  # Minimum liveness score

# Compliance settings
COMPLIANCE_REPORTING_ENABLED = os.environ.get('COMPLIANCE_REPORTING_ENABLED', 'False') == 'True'
REGULATOR_API_ENDPOINT = os.environ.get('REGULATOR_API_ENDPOINT')
REGULATOR_API_KEY = os.environ.get('REGULATOR_API_KEY')
REPORTING_JURISDICTION = os.environ.get('REPORTING_JURISDICTION', 'US')

# OAuth config
GOOGLE_OAUTH_CLIENT_ID = os.environ.get('GOOGLE_OAUTH_CLIENT_ID')
GOOGLE_OAUTH_CLIENT_SECRET = os.environ.get('GOOGLE_OAUTH_CLIENT_SECRET')
GOOGLE_OAUTH_REDIRECT_URI = os.environ.get('GOOGLE_OAUTH_REDIRECT_URI')

# MFA config
MFA_ISSUER_NAME = os.environ.get('MFA_ISSUER_NAME', 'PayGlobe')
MFA_REQUIRED_FOR_ADMIN = os.environ.get('MFA_REQUIRED_FOR_ADMIN', 'True') == 'True'
MFA_BACKUP_CODE_COUNT = 5
MFA_BACKUP_CODE_LENGTH = 10

# Password reset settings
PASSWORD_RESET_TIMEOUT = 3600  # 1 hour in seconds
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

# Analytics settings
ANALYTICS_CACHE_TIMEOUT = 3600  # 1 hour

# Rate limiting
RATE_LIMIT = 100  # requests per minute per IP

# Security Headers
SECURE_HSTS_SECONDS = 63072000  # 2 years in production
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Session Settings
SESSION_COOKIE_AGE = 8 * 60 * 60  # 8 hours (matches frontend)
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_COOKIE_NAME = 'sessionid'
SESSION_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_SAVE_EVERY_REQUEST = True  # Extend session on activity

# Content Security Policy
CONTENT_SECURITY_POLICY = {
    'DIRECTIVES': {
        'default-src': ["'self'"],
        'script-src': [
            "'self'",
            "'unsafe-inline'",  # Required for Stripe.js
            "https://js.stripe.com",
            "https://m.stripe.network",
            "https://cdn.jsdelivr.net"  # For Swagger UI
        ],
        'style-src': ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],  # For Swagger UI CSS
        'img-src': ["'self'", "data:", "https://*.stripe.com", "https://cdn.jsdelivr.net"],  # For Swagger UI favicon
        'connect-src': [
            "'self'",
            "https://api.stripe.com",
            "https://checkout.stripe.com"
        ],
        'frame-src': [
            "'self'",
            "https://js.stripe.com",
            "https://hooks.stripe.com"
        ],
        'font-src': ["'self'", "https://fonts.gstatic.com"]
    }
}

# Payment Providers
STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY', default='')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET', default='')
PAYPAL_CLIENT_ID = os.environ.get('PAYPAL_CLIENT_ID', default='')
PAYPAL_SECRET = os.environ.get('PAYPAL_SECRET', default='')

# Mobile Money Providers
MOBILE_MONEY_PROVIDERS = ['MTN', 'AIRTEL']
MOBILE_MONEY_CONFIG = {}

for provider in MOBILE_MONEY_PROVIDERS:
    MOBILE_MONEY_CONFIG[provider] = {
        'API_KEY': os.getenv(f'{provider}_API_KEY', ''),
        'USER_ID': os.getenv(f'{provider}_USER_ID', ''),
        'CALLBACK_URL': os.getenv(f'{provider}_CALLBACK_URL', '')
    }
    # Only raise error in production if config is missing
    if not DEBUG and not all(MOBILE_MONEY_CONFIG[provider].values()):
        raise ImproperlyConfigured(f"Missing {provider} mobile money configuration")

# Mobile Money Security
MOBILE_MONEY_ALLOWED_IPS = os.environ.get('MOBILE_MONEY_ALLOWED_IPS', default=[])

# Africa's Talking Config
AFRICASTALKING_API_KEY = os.environ.get('AFRICASTALKING_API_KEY')
AFRICASTALKING_USERNAME = os.environ.get('AFRICASTALKING_USERNAME')

# Verification Providers Configuration

# Africa's Talking (Primary for Ghana numbers)
AFRICASTALKING_API_KEY = os.environ.get('AFRICASTALKING_API_KEY')
AFRICASTALKING_USERNAME = os.environ.get('AFRICASTALKING_USERNAME')

# Twilio (International coverage)
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN')

# Nexmo/Vonage (Alternative provider)
NEXMO_API_KEY = os.environ.get('NEXMO_API_KEY')
NEXMO_API_SECRET = os.environ.get('NEXMO_API_SECRET')

# Verification Defaults
PHONE_VERIFICATION_PROVIDER = os.environ.get('PHONE_VERIFICATION_PROVIDER', 'africastalking')
VERIFICATION_TIMEOUT = 30  # seconds
VERIFICATION_MAX_RETRIES = 3

# Verification Providers
VERIFICATION_PROVIDERS = {
    'africastalking': {
        'API_KEY': os.environ.get('AFRICASTALKING_API_KEY'),
        'USERNAME': os.environ.get('AFRICASTALKING_USERNAME')
    },
    'twilio': {
        'ACCOUNT_SID': os.environ.get('TWILIO_ACCOUNT_SID'),
        'AUTH_TOKEN': os.environ.get('TWILIO_AUTH_TOKEN')
    },
    'nexmo': {
        'API_KEY': os.environ.get('NEXMO_API_KEY'),
        'API_SECRET': os.environ.get('NEXMO_API_SECRET')
    }
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTH_USER_MODEL = 'users.User'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'EXCEPTION_HANDLER': 'core.exceptions.custom_exception_handler',
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'user': '100/hour',
        'payment': '30/hour',  # Stricter limit for payment endpoints
    }
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'PayGlobe API',
    'DESCRIPTION': 'Fintech Platform API',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
    'COMPONENT_SPLIT_PATCH': True,
    'COMPONENT_NO_READ_ONLY_REQUIRED': True,
}

# Remove duplicate CORS settings

# Monitoring Configuration
MONITORING = {
    'PROMETHEUS_ENABLED': True,
    'GRAFANA_URL': os.getenv('GRAFANA_URL'),
    'DASHBOARD_REFRESH': 60,  # seconds
}
MONITORING_INTERVAL = 300  # 5 minutes
HEALTHCHECK_TIMEOUT = 10  # seconds

# Alert Webhooks
SLACK_WEBHOOK_URL = os.getenv('SLACK_WEBHOOK_URL')
GRAFANA_WEBHOOK_URL = os.getenv('GRAFANA_WEBHOOK_URL')

# Chat Webhooks
SLACK_WEBHOOK_URL = os.environ.get('SLACK_WEBHOOK_URL')
TEAMS_WEBHOOK_URL = os.environ.get('TEAMS_WEBHOOK_URL')

# Alert Routing
REGIONAL_ALERTS = {
    'GH': {
        'emails': ['gh-ops@example.com'],
        'slack': 'https://hooks.slack.com/services/TXXXXXX/BXXXXXX/XXXXXX'
    },
    'US': {
        'teams': 'https://outlook.office.com/webhook/XXXXXX'
    }
}

# Email Settings
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.environ.get('EMAIL_HOST')
EMAIL_PORT = os.environ.get('EMAIL_PORT', 587)
EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', True)
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL')
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@payglobe.com')

# SMS Settings
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN')
TWILIO_PHONE_NUMBER = os.environ.get('TWILIO_PHONE_NUMBER')

# Scanner Config
DOCUMENT_SCANNER_API_KEY = os.environ.get('DOCUMENT_SCANNER_API_KEY')
DOCUMENT_SCANNER_ENABLED = os.environ.get('DOCUMENT_SCANNER_ENABLED', 'False').lower() == 'true'
DOCUMENT_SCANNER_TIMEOUT = 30  # seconds
DOCUMENT_SCANNER_MAX_RETRIES = 3

# Verification Services
VERIFICATION_WEBHOOK_URL = os.environ.get('VERIFICATION_WEBHOOK_URL')
VERIFICATION_API_KEY = os.environ.get('VERIFICATION_API_KEY')
PHONE_VERIFICATION_PROVIDER = os.environ.get('PHONE_VERIFICATION_PROVIDER', 'africastalking')
SOURCE_OF_FUNDS_PROVIDER = os.environ.get('SOURCE_OF_FUNDS_PROVIDER', 'local')

# Logging Configuration
LOGS_DIR = Path(BASE_DIR) / 'logs'
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django.db': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}

# Celery Configuration
CELERY_BROKER_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
CELERY_TIMEZONE = 'UTC'

# Firebase Cloud Messaging (FCM)
FCM_CREDENTIALS_PATH = os.path.join(BASE_DIR, 'fcm_credentials.json')
FCM_DJANGO_SETTINGS = {
    'FCM_SERVER_KEY': os.getenv('FCM_SERVER_KEY', ''),
    'DEFAULT_FIREBASE_APP': None,
    'APP_VERBOSE_NAME': 'PayGlobe',
    'ONE_DEVICE_PER_USER': False,
    'DELETE_INACTIVE_DEVICES': True,
}

# Currency/Remittance Settings
BASE_COUNTRY = 'US'  # Your operating country code (ISO 3166-1 alpha-2)
DEFAULT_CURRENCY = 'USD'  # Default currency for transactions
EXCHANGE_API_URL = 'https://api.exchangerate.host'  # Exchange rate API endpoint
MAX_REMITTANCE_AMOUNT = 10000  # Maximum single transfer amount in USD
SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'GHS']  # List of supported currencies

# Remittance Webhook Settings
REMITTANCE_WEBHOOK_URL = os.environ.get('REMITTANCE_WEBHOOK_URL')
BOG_WEBHOOK_SECRET = os.environ.get('BOG_WEBHOOK_SECRET')  # For signature generation
REPORTING_THRESHOLD = Decimal('1000')  # Amount requiring BoG reporting

# Fee structure
REMITTANCE_FEE_BASE = Decimal('5.00')  # Fixed fee per transfer
REMITTANCE_FEE_PERCENTAGE = Decimal('0.01')  # 1% variable fee

# Exemption Settings
EXEMPTION_AUTO_APPROVE_LIMIT = Decimal('5000')  # Auto-approve below this amount
EXEMPTION_REVIEW_PERIOD = 24  # Hours to review exemptions

# Exemption Webhook
EXEMPTION_WEBHOOK_URL = os.environ.get('EXEMPTION_WEBHOOK_URL')

# Alert Configuration
ADMIN_EMAILS = os.environ.get('ADMIN_EMAILS', '').split(',')
ADMIN_PHONES = os.environ.get('ADMIN_PHONES', '').split(',')

# Regional Alert Routing
REGIONAL_ALERTS = {
    'GH': {  # Ghana
        'emails': os.environ.get('GH_ALERT_EMAILS', '').split(','),
        'slack': os.environ.get('GH_SLACK_WEBHOOK')
    },
    'US': {  # United States
        'teams': os.environ.get('US_TEAMS_WEBHOOK')
    }
}

# Alert Thresholds
HEALTH_ALERT_THRESHOLD = 3  # Failed checks before alert

TWILIO_PHONE_NUMBER = os.environ.get('TWILIO_PHONE_NUMBER')

# Chat Webhooks
SLACK_WEBHOOK_URL = os.environ.get('SLACK_WEBHOOK_URL')
TEAMS_WEBHOOK_URL = os.environ.get('TEAMS_WEBHOOK_URL')
