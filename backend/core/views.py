from django.db.models import Count, Sum
from django.utils import timezone
from datetime import timedelta
from users.models import User, Customer, Merchant
from payments.models.transaction import Transaction
from rest_framework.views import APIView
from rest_framework.permissions import IsAdminUser, AllowAny, IsAuthenticated
from rest_framework.response import Response

class HealthCheckView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        return Response({'status': 'healthy'})

class TenantTestView(APIView):
    def get(self, request):
        db_name = request.META.get('HTTP_X_TENANT_ID', 'default')
        return Response({
            'tenant': db_name,
            'user': request.user.email if request.user.is_authenticated else None
        })

class TestErrorView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        # Test 400 error
        if 'bad' in request.GET:
            return Response({'error': 'bad request'}, status=400)
        # Test 500 error
        if 'crash' in request.GET:
            1/0
        return Response({'message': 'test passed'})

class AuthTestView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response({
            'user': request.user.email,
            'scopes': list(request.auth.payload.keys()) if hasattr(request, 'auth') else []
        })

class AdminMetricsView(APIView):
    """
    Admin dashboard metrics endpoint
    Returns metrics that match the frontend AdminMetrics interface
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        # Calculate today's transactions
        today = timezone.now().date()
        transactions_today = Transaction.objects.filter(
            created_at__date=today,
            status='completed'
        ).count()
        
        # Get total users
        total_users = User.objects.count()
        
        # Get active users (users who logged in within the last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        active_users = User.objects.filter(
            last_login__gte=thirty_days_ago
        ).count()
        
        # Get pending verifications (users with verification_status='pending')
        pending_verifications = User.objects.filter(
            verification_status='pending'
        ).count()
        
        return Response({
            'totalUsers': total_users,
            'activeUsers': active_users,
            'transactionsToday': transactions_today,
            'pendingVerifications': pending_verifications
        })

def audit_log_view(request):
    logs = AuditLog.objects.all().order_by('-created_at')[:100]
    return render(request, 'core/audit_logs.html', {'logs': logs})

def metrics_view(request):
    """Expose Prometheus metrics."""
    return HttpResponse(generate_latest(), content_type='text/plain')
