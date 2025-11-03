from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q, Sum, Count
from datetime import datetime, timedelta
from payments.models.transaction import Transaction

from .models import Store, Product, MerchantOnboarding
from .serializers import StoreSerializer, ProductSerializer, OnboardingSerializer, VerificationSerializer
from users.permissions import IsMerchantUser, IsOwnerOrAdmin
from .permissions import SubscriptionRequiredMixin

class StoreViewSet(SubscriptionRequiredMixin, viewsets.ModelViewSet):
    serializer_class = StoreSerializer
    permission_classes = [permissions.IsAuthenticated, IsMerchantUser]

    def get_queryset(self):
        """Return stores belonging to the current merchant"""
        return Store.objects.filter(merchant__user=self.request.user)

    def perform_create(self, serializer):
        """Automatically set the merchant when creating a store"""
        serializer.save(merchant=self.request.user.merchant_profile)

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle store active status"""
        store = self.get_object()
        store.is_active = not store.is_active
        store.save()
        return Response({'status': 'success', 'is_active': store.is_active})

class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.user_type == 1:  # admin
            return Product.objects.all()
        return Product.objects.filter(store__merchant__user=user)

    def perform_create(self, serializer):
        """Ensure product belongs to merchant's store"""
        store = serializer.validated_data['store']
        if store.merchant.user != self.request.user:
            raise serializers.ValidationError("You can only add products to your own stores")
        serializer.save()

    @action(detail=True, methods=['post'])
    def toggle_availability(self, request, pk=None):
        """Toggle product availability"""
        product = self.get_object()
        product.is_available = not product.is_available
        product.save()
        return Response({'status': 'success', 'is_available': product.is_available})

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search products by name/description"""
        query = request.query_params.get('q', '').strip()
        if not query:
            return Response([])
            
        products = self.get_queryset().filter(
            Q(name__icontains=query) | 
            Q(description__icontains=query)
        )
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)

class MerchantDashboardViewSet(viewsets.ViewSet):
    """Provides merchant business analytics"""
    permission_classes = [permissions.IsAuthenticated, IsMerchantUser]
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get merchant business summary"""
        merchant = request.user.merchant_profile
        
        # Store stats
        stores = Store.objects.filter(merchant=merchant)
        active_stores = stores.filter(is_active=True).count()
        
        # Product stats
        products = Product.objects.filter(store__merchant=merchant)
        available_products = products.filter(is_available=True).count()
        
        # Transaction stats (last 30 days)
        thirty_days_ago = datetime.now() - timedelta(days=30)
        transactions = Transaction.objects.filter(
            merchant=merchant,
            created_at__gte=thirty_days_ago
        )
        
        total_sales = transactions.filter(status=Transaction.COMPLETED).aggregate(
            Sum('amount')
        )['amount__sum'] or 0
        
        return Response({
            'stores': stores.count(),
            'active_stores': active_stores,
            'products': products.count(),
            'available_products': available_products,
            'total_sales': float(total_sales),
            'transactions': transactions.count(),
            'completed_transactions': transactions.filter(status=Transaction.COMPLETED).count()
        })
    
    @action(detail=False, methods=['get'])
    def sales_trend(self, request):
        """Get daily sales for last 30 days"""
        merchant = request.user.merchant_profile
        thirty_days_ago = datetime.now() - timedelta(days=30)
        
        daily_sales = Transaction.objects.filter(
            merchant=merchant,
            status=Transaction.COMPLETED,
            created_at__gte=thirty_days_ago
        ).extra({
            'date': "date(created_at)"
        }).values('date').annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('date')
        
        return Response(daily_sales)

@api_view(['GET', 'POST'])
def onboarding_status(request):
    """Get or update onboarding status"""
    try:
        onboarding = MerchantOnboarding.objects.get(merchant=request.user.merchant_profile)
    except MerchantOnboarding.DoesNotExist:
        onboarding = MerchantOnboarding.objects.create(merchant=request.user.merchant_profile)
    
    if request.method == 'GET':
        serializer = OnboardingSerializer(onboarding)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = OnboardingSerializer(onboarding, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        # Update step if data is valid
        if 'data' in request.data:
            onboarding.data.update(request.data['data'])
            onboarding.current_step = min(onboarding.current_step + 1, onboarding.total_steps)
            onboarding.status = MerchantOnboarding.BUSINESS_INFO if onboarding.current_step == 1 else \
                               MerchantOnboarding.BANK_DETAILS if onboarding.current_step == 2 else \
                               MerchantOnboarding.VERIFICATION if onboarding.current_step == 3 else \
                               MerchantOnboarding.COMPLETED
            onboarding.save()
        
        return Response(OnboardingSerializer(onboarding).data)

@api_view(['POST'])
def upload_verification(request):
    """Handle verification document upload"""
    serializer = VerificationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    onboarding = MerchantOnboarding.objects.get(merchant=request.user.merchant_profile)
    if onboarding.status != MerchantOnboarding.VERIFICATION:
        return Response({'error': 'Not in verification stage'}, status=400)
    
    # In a real implementation, this would save to cloud storage
    doc_type = serializer.validated_data['document_type']
    onboarding.data[f'{doc_type}_file'] = serializer.validated_data['document_file'].name
    onboarding.save()
    
    # Check if all required docs are uploaded
    required_docs = ['id_card', 'business_license']
    if all(f'{doc}_file' in onboarding.data for doc in required_docs):
        onboarding.status = MerchantOnboarding.COMPLETED
        onboarding.save()
    
    return Response({'status': 'success'})
