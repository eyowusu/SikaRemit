from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Count, Sum
from django.utils import timezone
from datetime import timedelta
from ..models import AdminMetrics
from django.contrib.auth.models import User
from ..models import Transaction

class MetricsAPIView(APIView):
    permission_classes = [permissions.IsAdminUser]
    
    def get(self, request):
        time_range = request.query_params.get('range', '7d')
        
        # Calculate date ranges
        end_date = timezone.now()
        if time_range == '7d':
            start_date = end_date - timedelta(days=7)
            group_by = 'day'
        elif time_range == '30d':
            start_date = end_date - timedelta(days=30)
            group_by = 'day'
        elif time_range == '12m':
            start_date = end_date - timedelta(days=365)
            group_by = 'month'
        else:
            start_date = end_date - timedelta(days=7)
            group_by = 'day'
        
        # Get metrics data
        metrics = AdminMetrics.objects.filter(
            timestamp__gte=start_date,
            timestamp__lte=end_date
        ).extra(
            select={
                'period': f"DATE_TRUNC('{group_by}', timestamp)"
            }
        ).values('period').annotate(
            user_count=Count('id', distinct=True),
            transaction_sum=Sum('transaction_volume'),
            revenue_sum=Sum('revenue')
        ).order_by('period')
        
        return Response(metrics)

class MerchantMetricsAPIView(APIView):
    permission_classes = [permissions.IsAdminUser]
    
    def get(self, request):
        merchants = User.objects.filter(role='merchant')
        stats = {
            'total': merchants.count(),
            'active': merchants.filter(is_active=True).count(),
            'pending_verification': merchants.filter(verification_status='pending').count(),
            'revenue_30d': Transaction.objects.filter(
                merchant__in=merchants,
                created_at__gte=timezone.now() - timedelta(days=30)
            ).aggregate(Sum('amount'))['amount__sum'] or 0
        }
        return Response(stats)
