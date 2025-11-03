from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, viewsets
from users.models import Merchant, Customer
from payments.models import Transaction
from products.models import Product
from datetime import datetime, timedelta
from django.db.models import Sum, Count
from django.utils import timezone
from django.core.cache import cache
from django.conf import settings
from core.api_utils import api_success
from .models import DashboardStats
from .serializers import DashboardStatsSerializer
from users.models import AdminActivity
from users.serializers import AdminActivitySerializer

class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        
        if user.user_type == 1:  # admin
            data = {
                'total_merchants': Merchant.objects.count(),
                'total_customers': Customer.objects.count(),
                'total_transactions': Transaction.objects.count()
            }
            return api_success(data, request=request)
        
        elif user.user_type == 2:  # merchant
            merchant = Merchant.objects.get(user=user)
            transactions = Transaction.objects.filter(merchant=merchant)
            
            data = {
                'total_transactions': transactions.count(),
                'total_volume': sum(t.amount for t in transactions)
            }
            return api_success(data, request=request)
        
        else:  # customer
            customer = Customer.objects.get(user=user)
            transactions = Transaction.objects.filter(customer=customer)
            return api_success({'total_transactions': transactions.count(), 'total_spent': sum(t.amount for t in transactions)}, request=request)

class DashboardStatsViewSet(viewsets.ModelViewSet):
    queryset = DashboardStats.objects.all()
    serializer_class = DashboardStatsSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Only show stats for current user
        if not self.request.user.is_staff:
            queryset = queryset.filter(user=self.request.user)
            
        return queryset

class BusinessSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            if request.user.user_type != 2:
                return Response(
                    {'error': 'Merchant analytics only available for merchant accounts'}, 
                    status=403
                )
                
            merchant = Merchant.objects.select_related('subscription').get(user=request.user)
            
            if merchant.subscription.tier == 'basic':
                return Response(
                    {'error': 'Upgrade to Standard or Premium for analytics features'},
                    status=403
                )
                
            cache_key = f'business_summary_{merchant.id}'
            if not request.GET.get('refresh') and (cached_data := cache.get(cache_key)):
                return Response(cached_data)
                
            transactions = Transaction.objects.filter(
                merchant=merchant,
                created_at__gte=timezone.now() - timedelta(days=30)
            ).select_related('payment_method')
            
            top_products = Product.objects.filter(
                store__merchant=merchant
            ).prefetch_related('transaction_items').annotate(
                sales_count=Count('transaction_items')
            ).order_by('-sales_count')[:5]
            
            response_data = {
                'total_sales': transactions.count(),
                'total_volume': transactions.aggregate(Sum('amount'))['amount__sum'] or 0,
                'top_products': [{
                    'id': p.id,
                    'name': p.name,
                    'sales_count': p.sales_count
                } for p in top_products],
                'payment_methods': list(transactions.values('payment_method__name').annotate(
                    count=Count('id'),
                    total=Sum('amount')
                ).order_by('-total'))
            }
            
            cache.set(cache_key, response_data, timeout=settings.ANALYTICS_CACHE_TIMEOUT)
            return Response(response_data)
            
        except Exception as e:
            return Response(
                {'error': 'Failed to generate business summary', 'details': str(e)},
                status=500
            )

class SalesTrendsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if request.user.user_type != 2:  # merchant only
            return Response({'error': 'Unauthorized'}, status=403)
            
        merchant = Merchant.objects.get(user=request.user)
        
        if merchant.subscription_tier == 'basic':
            return Response({'error': 'Sales trends require Standard or Premium tier'}, status=403)
            
        days = int(request.query_params.get('days', 7))
        cache_key = f'sales_trends_{merchant.id}_{days}'
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data)
            
        now = timezone.now()
        daily_sales = []
        for i in range(days):
            date = now - timedelta(days=i)
            total = Transaction.objects.filter(
                merchant=merchant,
                created_at__date=date.date()
            ).aggregate(Sum('amount'))['amount__sum'] or 0
            daily_sales.append({
                'date': date.date(),
                'total': total
            })
            
        response_data = {
            'daily_sales': sorted(daily_sales, key=lambda x: x['date']),
            'period': f'Last {days} days'
        }
        
        cache.set(cache_key, response_data, timeout=settings.ANALYTICS_CACHE_TIMEOUT)
        return Response(response_data)

class AdminAuditView(APIView):
    permission_classes = [permissions.IsAdminUser]
    
    def get(self, request):
        # Get admin activities from last 7 days
        activities = AdminActivity.objects.filter(
            timestamp__gte=timezone.now() - timedelta(days=7)
        ).order_by('-timestamp')
        
        serializer = AdminActivitySerializer(activities, many=True)
        return Response(serializer.data)

class SystemSettingsView(APIView):
    permission_classes = [permissions.IsAdminUser]
    
    def get(self, request):
        settings_data = {
            'payment_gateway_enabled': settings.PAYMENT_GATEWAY_ENABLED,
            'max_login_attempts': settings.MAX_LOGIN_ATTEMPTS,
            'mfa_required': settings.MFA_REQUIRED
        }
        return Response(settings_data)

class AdminStatsView(APIView):
    permission_classes = [permissions.IsAdminUser]
    
    def get(self, request):
        users = Customer.objects.count()
        merchants = Merchant.objects.count()
        transactions = Transaction.objects.count()
        
        return api_success({
            'users': users,
            'merchants': merchants,
            'transactions': transactions
        })

class RecentActivityView(APIView):
    permission_classes = [permissions.IsAdminUser]
    
    def get(self, request):
        activities = AdminActivity.objects.order_by('-created_at')[:20]
        serializer = AdminActivitySerializer(activities, many=True)
        return api_success(serializer.data)

class SystemHealthView(APIView):
    permission_classes = [permissions.IsAdminUser]
    
    def get(self, request):
        # Check database connection
        try:
            Customer.objects.count()
            db_status = True
        except:
            db_status = False
            
        # Check cache
        try:
            cache.set('health_check', 'ok', 1)
            cache_status = cache.get('health_check') == 'ok'
        except:
            cache_status = False
            
        return api_success({
            'database': db_status,
            'api': True,
            'cache': cache_status,
            'workers': settings.CELERY_WORKERS
        })
