from pathlib import Path
import os
import sys
from datetime import timedelta
import warnings

warnings.filterwarnings("ignore", message="pkg_resources is deprecated as an API", category=UserWarning)

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

from dotenv import load_dotenv
load_dotenv(BASE_DIR / '.env')

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY', None)

# Custom user model
AUTH_USER_MODEL = 'users.User'

AUTHENTICATION_BACKENDS = [
    'axes.backends.AxesStandaloneBackend',
    'django.contrib.auth.backends.ModelBackend',
]

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DEBUG', 'True').lower() == 'true'

# Environment detection
IS_PRODUCTION = os.environ.get('ENVIRONMENT', 'development').lower() == 'production'

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

CSRF_TRUSTED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]

# Application definition
INSTALLED_APPS = [
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
    'channels',
    'django_extensions',
    'django_prometheus',
    'axes',
    'drf_spectacular_sidecar',
    'drf_spectacular',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
    'accounts',
    'core',
    'payments',
    'merchants',
    'compliance',
    'notifications',
    'dashboard',
    'users',
    'ussd',
    'kyc',
    'invoice',
    'fcm_django',  # Add this line
]

# Django Allauth Configuration
ACCOUNT_EMAIL_VERIFICATION = 'none'
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_AUTHENTICATION_METHOD = 'email'
ACCOUNT_USER_MODEL_USERNAME_FIELD = None

SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'SCOPE': ['profile', 'email'],
        'AUTH_PARAMS': {'access_type': 'online'},
        'APP': {
            'client_id': os.environ.get('GOOGLE_CLIENT_ID', ''),
            'secret': os.environ.get('GOOGLE_CLIENT_SECRET', ''),
            'key': ''
        }
    }
}

# drf-spectacular settings
SPECTACULAR_SETTINGS = {
    'SWAGGER_UI_DIST': 'SIDECAR',
    'SWAGGER_UI_FAVICON_HREF': 'SIDECAR',
    'REDOC_DIST': 'SIDECAR',
}

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'core.middleware.security_middleware.SecurityHeadersMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'allauth.account.middleware.AccountMiddleware',
    'axes.middleware.AxesMiddleware',
    'core.middleware.security_middleware.IPTrackingMiddleware',
    'core.middleware.security_middleware.DeviceTrackingMiddleware',
    'core.middleware.security_middleware.AuditLoggingMiddleware',
]

# Add production-only security middleware
if IS_PRODUCTION:
    MIDDLEWARE.insert(2, 'core.middleware.security_middleware.APIRateLimitMiddleware')
    MIDDLEWARE.append('core.middleware.security_middleware.SQLInjectionProtectionMiddleware')
    MIDDLEWARE.append('core.middleware.security_middleware.XSSProtectionMiddleware')

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

WSGI_APPLICATION = 'core.wsgi.application'

# ASGI application for WebSocket support
ASGI_APPLICATION = 'core.asgi.application'

# Database
use_sqlite = os.environ.get('DJANGO_USE_SQLITE', 'true').lower() in {'1', 'true', 'yes'}

if 'test' in sys.argv or 'pytest' in sys.argv[0]:
    # Use SQLite for testing
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'test_db.sqlite3',
            'ATOMIC_REQUESTS': False,
        }
    }
elif use_sqlite:
    # Optional SQLite database for local development
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
            'ATOMIC_REQUESTS': False,
        }
    }
else:
    # Production database (PostgreSQL)
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': 'SikaRemit',
            'USER': 'postgres',
            'PASSWORD': os.environ.get('DB_PASSWORD', None),  
            'HOST': 'localhost',
            'PORT': '5432',
            'ATOMIC_REQUESTS': False,
        }
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.MultiPartParser',
        'rest_framework.parsers.FormParser',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_THROTTLE_CLASSES': [],  # Configured conditionally below based on environment
    'DEFAULT_THROTTLE_RATES': {
        'anon': '200/hour',
        'user': '2000/hour',
        'admin': '20000/hour',
        'payment': '100/hour',  # Stricter rate for payment endpoints
        'login': '10/minute',   # Prevent brute force attacks
    },
    'EXCEPTION_HANDLER': 'rest_framework.views.exception_handler',
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# Custom Throttle Classes
THROTTLE_CLASSES = {
    'payment': 'payments.throttling.PaymentThrottle',
    'admin': 'payments.throttling.AdminThrottle',
    'public': 'payments.throttling.PublicThrottle',
    'endpoint': 'payments.throttling.EndpointThrottle',
}

# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
}

# CORS settings
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]
CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]

# Email settings
EMAIL_BACKEND = os.environ.get('EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend')
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', 587))
EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', 'True').lower() == 'true'
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'noreply@SikaRemit.local')

# Default country for mobile money operations
BASE_COUNTRY = os.environ.get('BASE_COUNTRY', 'GHA')  # Ghana

# Default currency for the application
DEFAULT_CURRENCY = os.environ.get('DEFAULT_CURRENCY', 'GHS')  # Ghanaian Cedi
RATE_LIMIT = int(os.environ.get('RATE_LIMIT', 300))  # Increased from 100 to 300/min

# Caching configuration
# Use local memory cache for development
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}

# Cache timeouts
CACHE_MIDDLEWARE_SECONDS = 300  # 5 minutes
CACHE_MIDDLEWARE_KEY_PREFIX = 'sikaremit'

# Celery Configuration
CELERY_BROKER_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'UTC'

# Celery Beat Settings (for scheduled tasks)
CELERY_BEAT_SCHEDULE = {
    'cleanup-expired-tokens': {
        'task': 'accounts.tasks.cleanup_expired_tokens',
        'schedule': 3600.0,  # Every hour
    },
    'process-scheduled-payments': {
        'task': 'payments.tasks.process_scheduled_payments',
        'schedule': 300.0,  # Every 5 minutes
    },
}

# Channels configuration for WebSocket support
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    },
}

# Sentry Configuration for Error Monitoring
SENTRY_DSN = os.environ.get('SENTRY_DSN', '')
SENTRY_TRACES_SAMPLE_RATE = float(os.environ.get('SENTRY_TRACES_SAMPLE_RATE', '0.1'))
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'development')
RELEASE_VERSION = os.environ.get('RELEASE_VERSION', 'dev')

# API Versioning
REST_FRAMEWORK['DEFAULT_VERSIONING_CLASS'] = 'core.versioning.SikaRemitAPIVersioning'
REST_FRAMEWORK['DEFAULT_VERSION'] = 'v1'
REST_FRAMEWORK['ALLOWED_VERSIONS'] = ['v1', 'v2']
REST_FRAMEWORK['VERSION_PARAM'] = 'version'

# Webhook Security
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET', '')

# Stripe Payments Configuration
STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY')
STRIPE_PUBLIC_KEY = os.environ.get('STRIPE_PUBLIC_KEY')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET')

# Currency settings for Stripe (amounts in cents)
STRIPE_CURRENCY_PRECISION = {
    'USD': 100,  # dollars to cents
    'GHS': 100,  # cedis to pesewas
    'EUR': 100   # euros to cents
}

# =============================================================================
# PAYMENT GATEWAY CONFIGURATION
# IMPORTANT: Set these environment variables for PRODUCTION use
# =============================================================================

# MTN Mobile Money (MoMo)
# Production URL: https://proxy.momoapi.mtn.com
# Sandbox URL: https://sandbox.momodeveloper.mtn.com
MTN_MOMO_API_KEY = os.environ.get('MTN_MOMO_API_KEY')
MTN_MOMO_API_SECRET = os.environ.get('MTN_MOMO_API_SECRET')
MTN_MOMO_SUBSCRIPTION_KEY = os.environ.get('MTN_MOMO_SUBSCRIPTION_KEY')
MTN_MOMO_WEBHOOK_SECRET = os.environ.get('MTN_MOMO_WEBHOOK_SECRET')
MTN_MOMO_API_URL = os.environ.get('MTN_MOMO_API_URL')  # REQUIRED - No default, must be explicitly set

# Airtel/Tigo Money
AIRTEL_API_KEY = os.environ.get('AIRTEL_API_KEY')
AIRTEL_API_URL = os.environ.get('AIRTEL_API_URL')
AIRTEL_CLIENT_ID = os.environ.get('AIRTEL_CLIENT_ID')
AIRTEL_CLIENT_SECRET = os.environ.get('AIRTEL_CLIENT_SECRET')
AIRTEL_WEBHOOK_SECRET = os.environ.get('AIRTEL_WEBHOOK_SECRET')

# Telecel Cash Configuration
TELECEL_API_KEY = os.environ.get('TELECEL_API_KEY')
TELECEL_API_URL = os.environ.get('TELECEL_API_URL')
TELECEL_MERCHANT_ID = os.environ.get('TELECEL_MERCHANT_ID')
TELECEL_WEBHOOK_SECRET = os.environ.get('TELECEL_WEBHOOK_SECRET')

# Payment callback URL - MUST be set to your production domain
PAYMENT_CALLBACK_URL = os.environ.get('PAYMENT_CALLBACK_URL')  # e.g., https://api.sikaremit.com/api/v1/payments/webhooks

# Google OAuth Configuration
GOOGLE_OAUTH_CLIENT_ID = os.environ.get('GOOGLE_OAUTH_CLIENT_ID')
GOOGLE_OAUTH_CLIENT_SECRET = os.environ.get('GOOGLE_OAUTH_CLIENT_SECRET')

# Stripe Payments Configuration
STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY')
STRIPE_PUBLIC_KEY = os.environ.get('STRIPE_PUBLIC_KEY')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET')

# MFA Configuration
MFA_ISSUER_NAME = os.environ.get('MFA_ISSUER_NAME', 'SikaRemit')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'noreply@SikaRemit.com')

# SMS Configuration (AfricasTalking - Default)
SMS_PROVIDER = os.environ.get('SMS_PROVIDER', 'africastalking')
AFRICASTALKING_USERNAME = os.environ.get('AFRICASTALKING_USERNAME')
AFRICASTALKING_API_KEY = os.environ.get('AFRICASTALKING_API_KEY')
AFRICASTALKING_SENDER_ID = os.environ.get('AFRICASTALKING_SENDER_ID', 'SikaRemit')

# Twilio SMS Configuration (Alternative)
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN')
TWILIO_PHONE_NUMBER = os.environ.get('TWILIO_PHONE_NUMBER')

# Axes Configuration - Enable only in production
AXES_ENABLED = IS_PRODUCTION
AXES_FAILURE_LIMIT = 5  # Lock after 5 failed attempts
AXES_COOLOFF_TIME = 1  # 1 hour lockout
AXES_LOCKOUT_TEMPLATE = 'account/locked.html'

# =============================================================================
# PRODUCTION-ONLY SECURITY SETTINGS
# =============================================================================
# These settings are only enabled in production to avoid interfering with development

if IS_PRODUCTION:
    # Enable rate limiting in production
    REST_FRAMEWORK['DEFAULT_THROTTLE_CLASSES'] = [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ]
    
    # Stricter CSRF settings for production
    CSRF_COOKIE_SECURE = True
    CSRF_COOKIE_HTTPONLY = True
    CSRF_USE_SESSIONS = True
    
    # Session security
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    
    # Security headers
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_SSL_REDIRECT = True
    
    # X-Frame-Options
    X_FRAME_OPTIONS = 'DENY'
    
    # Use Redis cache in production
    CACHES = {
        'default': {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': os.environ.get('REDIS_URL', 'redis://localhost:6379/1'),
            'OPTIONS': {
                'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            }
        }
    }
else:
    # Development settings - relaxed security for easier testing
    CSRF_COOKIE_SECURE = False
    SESSION_COOKIE_SECURE = False
    SECURE_SSL_REDIRECT = False

# Compliance settings
COMPLIANCE_REPORTING_ENABLED = os.environ.get('COMPLIANCE_REPORTING_ENABLED', 'False').lower() == 'true'

# Initialize Sentry if DSN is configured
if SENTRY_DSN:
    from core.error_monitoring import initialize_sentry
    initialize_sentry()
