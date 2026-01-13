from django.db import connection
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework import viewsets
from .models import Country, SystemSettings
from .serializers import CountrySerializer

User = get_user_model()

# Import Transaction model - try to avoid import errors
try:
    from payments.models.transaction import Transaction
except ImportError:
    Transaction = None

class HealthCheckView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            # Test database connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            
            return Response({
                'status': 'healthy',
                'database': 'connected',
                'timestamp': timezone.now().isoformat()
            })
        except Exception as e:
            return Response({
                'status': 'unhealthy',
                'error': str(e),
                'timestamp': timezone.now().isoformat()
            }, status=500)

# Import from the middleware module file (not the package)
from functools import wraps
from django.utils.decorators import method_decorator
import time
import logging

_perf_logger = logging.getLogger(__name__)

def _api_performance_monitor(view_func=None, threshold_ms=1000):
    """Performance monitoring decorator"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            request = args[0] if hasattr(args[0], 'method') else args[1]
            try:
                result = func(*args, **kwargs)
                duration_ms = (time.time() - start_time) * 1000
                if duration_ms > threshold_ms:
                    _perf_logger.warning(f"SLOW_API: {request.method} {request.path} {duration_ms:.2f}ms")
                if hasattr(result, '__setitem__'):
                    result['X-API-Response-Time'] = f"{duration_ms:.2f}ms"
                return result
            except Exception as e:
                _perf_logger.error(f"API_ERROR: {request.method} {request.path} {type(e).__name__}")
                raise
        return wrapper
    if view_func:
        return decorator(view_func)
    return decorator

api_performance_monitor_method = method_decorator(_api_performance_monitor)

class AdminMetricsView(APIView):
    """
    Admin dashboard metrics endpoint
    Returns metrics that match the frontend AdminMetrics interface
    """
    permission_classes = [IsAdminUser]

    @api_performance_monitor_method
    def get(self, request):
        # Calculate today's transactions
        today = timezone.now().date()
        if Transaction is not None:
            transactions_today = Transaction.objects.filter(
                created_at__date=today,
                status='completed'
            ).count()
        else:
            transactions_today = 0
        
        # Get total users
        total_users = User.objects.count()
        
        # Get active users (users who logged in within the last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        active_users = User.objects.filter(
            last_login__gte=thirty_days_ago
        ).count()
        
        # Get pending verifications (users that are not verified)
        pending_verifications = User.objects.filter(
            is_verified=False
        ).count()
        
        return Response({
            'totalUsers': total_users,
            'activeUsers': active_users,
            'transactionsToday': transactions_today,
            'pendingVerifications': pending_verifications
        })

from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import SystemSettings


class AdminSettingsViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing admin system settings
    """
    permission_classes = [permissions.IsAuthenticated]  # TODO: Add admin permission

    def get_queryset(self):
        # Admin only - return all settings (should only be one record)
        return SystemSettings.objects.all()

    def get_object(self):
        # Get the singleton system settings object
        return SystemSettings.get_settings()

    @action(detail=False, methods=['get', 'patch'])
    def general(self, request):
        """Get or update general system settings"""
        settings = SystemSettings.get_settings()

        if request.method == 'GET':
            data = {
                'system_name': settings.system_name,
                'default_timezone': settings.default_timezone,
                'default_currency': settings.default_currency,
                'default_language': settings.default_language,
                'maintenance_mode': settings.maintenance_mode,
                'debug_mode': settings.debug_mode,
                'public_registration': settings.public_registration
            }
            return Response(data)

        elif request.method == 'PATCH':
            # Only update general settings fields
            allowed_fields = [
                'system_name', 'default_timezone', 'default_currency',
                'default_language', 'maintenance_mode', 'debug_mode', 'public_registration'
            ]

            update_data = {k: v for k, v in request.data.items() if k in allowed_fields}

            for field, value in update_data.items():
                setattr(settings, field, value)

            settings.updated_by = request.user
            settings.save()

            return Response({"message": "General settings updated successfully"})

    @action(detail=False, methods=['get', 'patch'])
    def security(self, request):
        """Get or update security settings"""
        settings = SystemSettings.get_settings()

        if request.method == 'GET':
            data = {
                'session_timeout': settings.session_timeout,
                'max_login_attempts': settings.max_login_attempts,
                'min_password_length': settings.min_password_length,
                'password_policy': settings.password_policy,
                'two_factor_required': settings.two_factor_required,
                'ip_whitelisting': settings.ip_whitelisting,
                'audit_logging': settings.audit_logging
            }
            return Response(data)

        elif request.method == 'PATCH':
            # Only update security settings fields
            allowed_fields = [
                'session_timeout', 'max_login_attempts', 'min_password_length',
                'password_policy', 'two_factor_required', 'ip_whitelisting', 'audit_logging'
            ]

            update_data = {k: v for k, v in request.data.items() if k in allowed_fields}

            for field, value in update_data.items():
                setattr(settings, field, value)

            settings.updated_by = request.user
            settings.save()

            return Response({"message": "Security settings updated successfully"})

    @action(detail=False, methods=['get', 'patch'])
    def api(self, request):
        """Get or update API settings"""
        settings = SystemSettings.get_settings()

        if request.method == 'GET':
            data = {
                'api_rate_limit': settings.api_rate_limit,
                'api_timeout': settings.api_timeout,
                'webhook_secret': '••••••••',  # Don't expose webhook secret
                'api_version': settings.api_version,
                'cors_origins': settings.cors_origins,
                'api_documentation': settings.api_documentation,
                'request_logging': settings.request_logging
            }
            return Response(data)

        elif request.method == 'PATCH':
            # Only update API settings fields
            allowed_fields = [
                'api_rate_limit', 'api_timeout', 'webhook_secret', 'api_version',
                'cors_origins', 'api_documentation', 'request_logging'
            ]

            update_data = {k: v for k, v in request.data.items() if k in allowed_fields}

            for field, value in update_data.items():
                setattr(settings, field, value)

            settings.updated_by = request.user
            settings.save()

            return Response({"message": "API settings updated successfully"})

    @action(detail=False, methods=['get', 'patch'])
    def notifications(self, request):
        """Get or update notification settings"""
        settings = SystemSettings.get_settings()

        if request.method == 'GET':
            data = {
                'admin_email_notifications': settings.admin_email_notifications,
                'admin_sms_notifications': settings.admin_sms_notifications,
                'admin_push_notifications': settings.admin_push_notifications,
                'error_alerts': settings.error_alerts,
                'transaction_alerts': settings.transaction_alerts,
                'admin_email': settings.admin_email,
                'transaction_alert_threshold': float(settings.transaction_alert_threshold)
            }
            return Response(data)

        elif request.method == 'PATCH':
            # Only update notification settings fields
            allowed_fields = [
                'admin_email_notifications', 'admin_sms_notifications', 'admin_push_notifications',
                'error_alerts', 'transaction_alerts', 'admin_email', 'transaction_alert_threshold'
            ]

            update_data = {k: v for k, v in request.data.items() if k in allowed_fields}

            for field, value in update_data.items():
                setattr(settings, field, value)

            settings.updated_by = request.user
            settings.save()

            return Response({"message": "Notification settings updated successfully"})

    @action(detail=False, methods=['get', 'patch'])
    def maintenance(self, request):
        """Get or update maintenance settings"""
        settings = SystemSettings.get_settings()

        if request.method == 'GET':
            data = {
                'scheduled_maintenance': settings.scheduled_maintenance,
                'auto_backups': settings.auto_backups,
                'log_rotation': settings.log_rotation,
                'backup_frequency': settings.backup_frequency,
                'log_retention_days': settings.log_retention_days
            }
            return Response(data)

        elif request.method == 'PATCH':
            # Only update maintenance settings fields
            allowed_fields = [
                'scheduled_maintenance', 'auto_backups', 'log_rotation',
                'backup_frequency', 'log_retention_days'
            ]

            update_data = {k: v for k, v in request.data.items() if k in allowed_fields}

            for field, value in update_data.items():
                setattr(settings, field, value)

            settings.updated_by = request.user
            settings.save()

            return Response({"message": "Maintenance settings updated successfully"})

class CountryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for country data - public endpoint, no authentication required
    """
    queryset = Country.objects.filter(is_active=True)
    serializer_class = CountrySerializer
    permission_classes = [AllowAny]  # Public endpoint
    pagination_class = None  # Return all countries at once
