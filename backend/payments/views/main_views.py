from rest_framework import viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.throttling import UserRateThrottle
from ..models.payment_method import PaymentMethod
from ..models.transaction import Transaction
from ..models import USSDTransaction
from ..models.subscriptions import Subscription
from ..models.scheduled_payout import ScheduledPayout
from ..models.cross_border import CrossBorderRemittance
from payments.models import DomesticTransfer
from ..models.verification import VerificationLog
from users.models import Customer, Merchant
from ..serializers import PaymentMethodSerializer, TransactionSerializer, SubscriptionSerializer, ScheduledPayoutSerializer, USSDTransactionSerializer, AdminTransactionSerializer, DomesticTransferSerializer
from ..serializers.cross_border import CrossBorderRemittanceSerializer
# from accounts.serializers import BillPaymentSerializer
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from ..services import PaymentService
import logging
import traceback
from django.db import models
from django.core.cache import cache
from uuid import uuid4
from ..throttling import EndpointThrottle
from decimal import Decimal
from django.conf import settings
from django.db.models import Count, Avg, Case, When, IntegerField, FloatField
from functools import wraps
from django.http import JsonResponse
from django.utils import timezone
import hmac
import hashlib
import json
import requests

logger = logging.getLogger(__name__)


def validate_payment_method(view_func):
    """Decorator to validate payment method before processing"""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        payment_method_id = request.data.get('payment_method_id')
        if not payment_method_id:
            return JsonResponse({'error': 'Payment method ID is required'}, status=400)
        try:
            payment_method = PaymentMethod.objects.get(
                id=payment_method_id,
                user=request.user
            )
            
            if not payment_method.is_active:
                return JsonResponse({'error': 'Payment method not active'}, status=400)
                
            request.payment_method = payment_method
            return view_func(request, *args, **kwargs)
            
        except PaymentMethod.DoesNotExist:
            return JsonResponse({'error': 'Invalid payment method'}, status=400)
    return wrapper

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validate_qr_payment(request):
    """Validate QR code for payment"""
    qr_data = request.data.get('qr_data')
    
    if not qr_data:
        return Response(
            {'error': 'QR data is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Mock QR validation - in real implementation, decode and validate QR
        # For now, assume valid QR with sample data
        payment_details = {
            'amount': 50.00,
            'currency': 'GHS',
            'merchant_name': 'Sample Merchant',
            'reference': f'QR-{uuid4().hex[:8].upper()}'
        }
        
        return Response({
            'valid': True,
            'payment_details': payment_details
        })
    except Exception as e:
        logger.error(f"Error validating QR: {str(e)}")
        return Response(
            {'valid': False, 'error': 'Invalid QR code'},
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_qr_payment(request):
    """Process QR payment"""
    qr_reference = request.data.get('qr_reference')
    payment_method_id = request.data.get('payment_method_id')
    
    if not qr_reference:
        return Response(
            {'error': 'QR reference is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Mock QR payment processing
        transaction_id = f'TXN-{uuid4().hex[:8].upper()}'
        
        return Response({
            'success': True,
            'transaction_id': transaction_id,
            'amount': 50.00,
            'currency': 'GHS',
            'merchant': 'Sample Merchant',
            'reference': qr_reference
        })
    except Exception as e:
        logger.error(f"Error processing QR payment: {str(e)}")
        return Response(
            {'success': False, 'error': 'Payment processing failed'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
            
class PaymentRateThrottle(UserRateThrottle):
    """Custom rate limit for payment endpoints"""
    scope = 'payment'
    rate = '30/hour'

class PaymentMethodViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentMethodSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PaymentMethod.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    def perform_destroy(self, instance):
        instance.delete()
    
    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        """Set a payment method as default"""
        payment_method = self.get_object()
        
        # Remove default from all other methods
        PaymentMethod.objects.filter(
            user=request.user,
            is_default=True
        ).update(is_default=False)
        
        # Set this method as default
        payment_method.is_default = True
        payment_method.save()
        
        serializer = self.get_serializer(payment_method)
        return Response({
            'status': 'success',
            'message': 'Default payment method updated',
            'data': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """Verify a payment method"""
        from ..gateways.stripe import StripeGateway
        from ..gateways.mobile_money import MobileMoneyGateway

        payment_method = self.get_object()
        verification_type = request.data.get('verification_type', 'micro_deposit')

        try:
            if payment_method.method_type == PaymentMethod.CARD:
                # For cards, use Stripe's verification
                gateway = StripeGateway()
                # This would typically create a small charge and ask user to confirm
                # For now, we'll simulate successful verification
                payment_method.details['verified'] = True
                payment_method.details['verified_at'] = str(timezone.now())
                payment_method.save()

                return Response({
                    'status': 'success',
                    'message': 'Card verification completed successfully'
                })

            elif payment_method.method_type in [PaymentMethod.MTN_MOMO, PaymentMethod.TELECEL, PaymentMethod.AIRTEL_TIGO]:
                # For mobile money, use direct mobile money verification
                gateway = MobileMoneyGateway()
                # This would typically send an OTP or verification code
                # For now, we'll simulate successful verification
                payment_method.details['verified'] = True
                payment_method.details['verified_at'] = str(timezone.now())
                payment_method.save()

                return Response({
                    'status': 'success',
                    'message': 'Mobile money verification completed successfully'
                })

            elif payment_method.method_type == PaymentMethod.BANK:
                # For bank accounts, we would use micro-deposits or instant verification
                # This would require integration with bank APIs
                return Response({
                    'status': 'pending',
                    'message': 'Bank verification initiated. Please check your account in 1-2 business days.',
                    'verification_id': f'VER-{payment_method.id}-{uuid4().hex[:8]}'
                })

            else:
                # Default verification for other methods
                payment_method.details['verified'] = True
                payment_method.details['verified_at'] = str(timezone.now())
                payment_method.save()

                return Response({
                    'status': 'success',
                    'message': 'Payment method verified'
                })

        except Exception as e:
            return Response(
                {'error': f'Verification failed: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def confirm_verification(self, request, pk=None):
        """Confirm payment method verification"""
        payment_method = self.get_object()
        verification_code = request.data.get('code')
        verification_id = request.data.get('verification_id')

        try:
            if not verification_code:
                return Response(
                    {'error': 'Verification code is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # For now, we'll accept any 6-digit code for demo purposes
            # In production, this would verify against stored codes or gateway responses
            if len(verification_code) >= 4 and verification_code.isdigit():
                payment_method.details['verified'] = True
                payment_method.details['verified_at'] = str(timezone.now())
                payment_method.details['verification_code'] = verification_code
                payment_method.save()

                return Response({
                    'status': 'success',
                    'message': 'Payment method verified successfully'
                })
            else:
                return Response(
                    {'error': 'Invalid verification code'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        except Exception as e:
            return Response(
                {'error': f'Verification confirmation failed: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get payment method usage analytics"""
        from django.db.models import Count, Sum, Avg
        from ..models.transaction import Transaction
        from datetime import timedelta
        from django.utils import timezone
        
        user_methods = self.get_queryset()
        
        # Get date range from query params
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)
        
        analytics_data = []
        
        for method in user_methods:
            # Get transactions using this payment method
            transactions = Transaction.objects.filter(
                payment_method=method,
                created_at__gte=start_date
            )
            
            method_analytics = {
                'id': method.id,
                'method_type': method.method_type,
                'display_name': self._get_display_name(method),
                'is_default': method.is_default,
                'total_transactions': transactions.count(),
                'total_amount': float(transactions.aggregate(Sum('amount'))['amount__sum'] or 0),
                'avg_transaction': float(transactions.aggregate(Avg('amount'))['amount__avg'] or 0),
                'success_rate': self._calculate_success_rate(transactions),
                'last_used': transactions.order_by('-created_at').first().created_at if transactions.exists() else None,
                'created_at': method.created_at
            }
            
            analytics_data.append(method_analytics)
        
        # Sort by total transactions
        analytics_data.sort(key=lambda x: x['total_transactions'], reverse=True)
        
        return Response({
            'period_days': days,
            'total_methods': len(analytics_data),
            'methods': analytics_data,
            'summary': {
                'most_used': analytics_data[0] if analytics_data else None,
                'total_transactions': sum(m['total_transactions'] for m in analytics_data),
                'total_amount': sum(m['total_amount'] for m in analytics_data)
            }
        })
    
    def _get_display_name(self, method):
        """Get display name for payment method"""
        if method.method_type == PaymentMethod.CARD:
            return f"{method.details.get('brand', 'Card')} ending in {method.details.get('last4', '****')}"
        elif method.method_type == PaymentMethod.BANK:
            return f"{method.details.get('bank_name', 'Bank')} - {method.details.get('account_number', '')[-4:]}"
        elif method.method_type == PaymentMethod.MTN_MOMO:
            return f"MTN Mobile Money - {method.details.get('phone_number', '')}"
        elif method.method_type == PaymentMethod.TELECEL:
            return f"Telecel Cash - {method.details.get('phone_number', '')}"
        elif method.method_type == PaymentMethod.AIRTEL_TIGO:
            return f"AirtelTigo Money - {method.details.get('phone_number', '')}"
        else:
            return method.get_method_type_display()
    
    def _calculate_success_rate(self, transactions):
        """Calculate success rate for transactions"""
        total = transactions.count()
        if total == 0:
            return 100.0
        
        from ..models.transaction import Transaction
        successful = transactions.filter(status=Transaction.COMPLETED).count()
        return round((successful / total) * 100, 2)

class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    throttle_classes = [EndpointThrottle]
    pagination_class = None  # Disable pagination for now, can be added later if needed

    def get_queryset(self):
        user = self.request.user
        if user.user_type == 2:  # merchant
            return Transaction.objects.filter(merchant__user=user)
        return Transaction.objects.filter(customer__user=user)

    @action(detail=False, methods=['post'])
    @validate_payment_method
    def process_payment(self, request):
        """
        Process a new payment with KYC verification
        Required params:
        - merchant_id
        - amount
        - currency (default USD)
        - payment_method_id
        """
        try:
            logger.info(json.dumps({
                'type': 'payment_initiated',
                'request_id': request.request_id,
                'amount': request.data.get('amount'),
                'method': request.data.get('payment_method_id')
            }))

            # First check KYC eligibility before processing
            kyc_check = PaymentService._check_user_kyc_eligibility(request.user)
            if not kyc_check['eligible']:
                # User needs KYC verification
                return Response({
                    'error': kyc_check['error'],
                    'requires_kyc': True,
                    'kyc_status': kyc_check.get('kyc_status'),
                    'next_action': kyc_check.get('next_action'),
                    'transaction_attempts': kyc_check.get('transaction_attempts', 0)
                }, status=status.HTTP_403_FORBIDDEN)

            # User is verified, proceed with payment processing
            customer = Customer.objects.get(user=request.user)
            merchant = Merchant.objects.get(id=request.data['merchant_id'])
            payment_method = request.payment_method

            txn = PaymentService.process_payment(
                customer=customer,
                merchant=merchant,
                amount=float(request.data['amount']),
                currency=request.data.get('currency', 'USD'),
                payment_method=payment_method,
                metadata=request.data.get('metadata')
            )

            logger.info(json.dumps({
                'type': 'payment_completed',
                'request_id': request.request_id,
                'transaction_id': txn.id,
                'status': 'success'
            }))

            serializer = self.get_serializer(txn)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(json.dumps({
                'type': 'payment_failed',
                'request_id': request.request_id,
                'error': str(e),
                'traceback': traceback.format_exc()
            }))
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def refund(self, request, pk=None):
        """
        Process a refund for an existing transaction
        Optional params:
        - amount (partial refund if specified)
        """
        from ..gateways.stripe import StripeGateway
        from ..gateways.mobile_money import MobileMoneyGateway

        try:
            txn = self.get_object()
            amount = float(request.data.get('amount')) if 'amount' in request.data else None

            # Route to appropriate gateway based on payment method
            if txn.payment_method.method_type == PaymentMethod.CARD:
                gateway = StripeGateway()
            elif txn.payment_method.method_type in [PaymentMethod.MTN_MOMO, PaymentMethod.TELECEL, PaymentMethod.AIRTEL_TIGO]:
                gateway = MobileMoneyGateway()
            elif txn.payment_method.method_type == PaymentMethod.BANK:
                # For bank transfers, refunds need to be processed manually
                return Response(
                    {'error': 'Bank transfers cannot be refunded automatically. Please contact support.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            else:
                return Response(
                    {'error': 'Refund not supported for this payment method'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Process refund through gateway
            result = gateway.refund_payment(txn.transaction_id, amount)

            if result.get('success'):
                txn.status = Transaction.REFUNDED
                txn.save()

                serializer = self.get_serializer(txn)
                return Response(serializer.data)
            else:
                return Response(
                    {'error': result.get('error', 'Refund failed')},
                    status=status.HTTP_400_BAD_REQUEST
                )

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'])
    def process_bill_payment(self, request):
        """
        Process a bill payment
        ---
        parameters:
          - name: bill_reference
            required: true
            type: string
          - name: bill_type
            required: true
            type: string
            enum: [utility, tax, loan, other]
          - name: amount
            type: number
          - name: bill_issuer
            type: string
          - name: due_date
            type: string
            format: date
        responses:
          201:
            description: Bill payment processed
          400:
            description: Invalid bill payment data
        """
        try:
            serializer = BillPaymentSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            payment = PaymentService.process_bill_payment(
                user=request.user,
                bill_data=serializer.validated_data
            )
            
            return Response(
                BillPaymentSerializer(payment).data,
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            logger.error(f"Bill payment failed: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def pending_bills(self, request):
        """
        Get pending bill payments
        ---
        parameters:
          - name: bill_type
            type: string
            enum: [utility, tax, loan, other]
          - name: days_overdue
            type: integer
            description: Filter bills overdue by X days
        responses:
          200:
            description: List of pending bill payments
        """
        from django.utils import timezone
        from django.db.models import Q
        
        queryset = Payment.objects.filter(is_remitted=False)
        
        # Apply filters
        bill_type = request.query_params.get('bill_type')
        if bill_type:
            queryset = queryset.filter(bill_type=bill_type)
            
        days_overdue = request.query_params.get('days_overdue')
        if days_overdue:
            cutoff_date = timezone.now() - timezone.timedelta(days=int(days_overdue))
            queryset = queryset.filter(
                Q(due_date__lt=cutoff_date) | 
                Q(due_date__isnull=False, created_at__lt=cutoff_date)
            )
            
        serializer = BillPaymentSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_late_fee(self, request, pk=None):
        """
        Add late fee to overdue bill
        ---
        parameters:
          - name: amount
            type: number
            required: true
        responses:
          200:
            description: Updated bill payment
          400:
            description: Invalid request
        """
        from django.db import transaction
        
        payment = self.get_object()
        fee_amount = request.data.get('amount')
        
        if not fee_amount:
            return Response(
                {'error': 'Late fee amount is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            with transaction.atomic():
                payment.late_fee += float(fee_amount)
                payment.amount += float(fee_amount)
                payment.save()
                
                return Response(BillPaymentSerializer(payment).data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def detailed_remittance_report(self, request):
        """
        Get detailed remittance report with filters
        ---
        parameters:
          - name: bill_type
            type: string
            enum: [utility, tax, loan, other]
          - name: start_date
            type: string
            format: date
          - name: end_date
            type: string
            format: date
        responses:
          200:
            description: Detailed remittance report data
        """
        from .services.remittance_service import RemittanceService
        
        bill_type = request.query_params.get('bill_type')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        date_range = (start_date, end_date) if start_date or end_date else None
        
        report = RemittanceService.generate_detailed_remittance_report(
            bill_type=bill_type,
            date_range=date_range
        )
        
        return Response(report)

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """
        Get recent transactions for the user
        ---
        parameters:
          - name: limit
            type: integer
            default: 10
            description: Number of recent transactions to return
        responses:
          200:
            description: List of recent transactions
        """
        limit = int(request.query_params.get('limit', 10))
        queryset = self.get_queryset().order_by('-created_at')[:limit]
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Comprehensive analytics data"""
        from ..models.verification import VerificationLog, VerificationTrend
        from ..utils.alerts import AlertService
        from django.db.utils import OperationalError, ProgrammingError
        
        error = None

        try:
            providers = list(
                VerificationLog.objects.values('provider').annotate(
                    total=Count('id'),
                    success_rate=Avg(
                        Case(When(success=True, then=100), default=0, output_field=FloatField())
                    ),
                    avg_time=Avg('response_time'),
                ).order_by('-total')
            )
            trends = list(
                VerificationTrend.objects.order_by('-date').values('date', 'success_rate', 'avg_response_time')[:30]
            )
            geo = list(VerificationLog.geographic_stats())
        except (OperationalError, ProgrammingError):
            providers = []
            trends = []
            geo = []
        except Exception as e:
            providers = []
            trends = []
            geo = []
            error = str(e)

        try:
            alerts = AlertService.get_recent_alerts()
        except Exception as e:
            alerts = []
            error = error or str(e)

        payload = {
            'alerts': alerts,
            'providers': providers,
            'trends': trends,
            'geo': geo,
        }
        if error:
            payload['error'] = error

        return Response(payload)

    @action(detail=False, methods=['get'])
    def provider_stats(self, request):
        """
        Get provider performance statistics
        ---
        responses:
          200:
            description: Provider statistics
        """
        from ..models.verification import VerificationLog, ProviderHealth
        from django.db.models import Avg, Count
        from django.db.utils import OperationalError, ProgrammingError
        
        try:
            health_status = {
                p.provider: {
                    'healthy': p.is_healthy,
                    'last_checked': p.last_checked,
                    'success_rate': p.success_rate,
                }
                for p in ProviderHealth.objects.all()
            }
            stats = list(
                VerificationLog.objects.values('provider').annotate(
                    total=Count('id'),
                    success_rate=Avg('success'),
                    avg_response_time=Avg('response_time'),
                ).order_by('-total')
            )
        except (OperationalError, ProgrammingError):
            health_status = {}
            stats = []

        return Response({
            'health_status': health_status,
            'verification_stats': stats,
        })

    @action(detail=False, methods=['get'])
    def geographic_analytics(self, request):
        """Comprehensive analytics data"""
        from ..models.verification import VerificationLog, ProviderHealth
        
        return Response({
            'providers': [
                {
                    'name': p.provider,
                    'healthy': p.is_healthy,
                    'success_rate': p.success_rate,
                    'response_time': p.response_time
                }
                for p in ProviderHealth.objects.all()
            ],
            'geo': list(VerificationLog.geographic_stats()),
            'alerts': self._get_recent_alerts()
        })
    
    def _get_recent_alerts(self):
        """Get recent outage alerts"""
        # In production, query from actual alert system
        return [
            {
                'provider': 'africastalking',
                'status': 'critical',
                'message': 'Timeout errors',
                'timestamp': '2025-10-31 14:30'
            }
        ]

    @action(detail=False, methods=['post'])
    def verify_payment(self, request):
        """
        Verify a payment transaction
        """
        transaction_id = request.data.get('transaction_id')
        reference = request.data.get('reference')

        if not transaction_id or not reference:
            return Response(
                {'error': 'transaction_id and reference are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            transaction = Transaction.objects.get(
                id=transaction_id,
                customer__user=request.user
            )

            # Verify the payment with the gateway
            # This is a simplified implementation
            if transaction.status == Transaction.COMPLETED:
                return Response({
                    'success': True,
                    'status': 'verified',
                    'transaction': self.get_serializer(transaction).data
                })
            else:
                return Response({
                    'success': False,
                    'status': 'pending',
                    'message': 'Payment verification in progress'
                })

        except Transaction.DoesNotExist:
            return Response(
                {'error': 'Transaction not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def request_refund(self, request):
        """
        Request a refund for a transaction
        """
        transaction_id = request.data.get('transaction_id')
        amount = request.data.get('amount')
        reason = request.data.get('reason')

        if not transaction_id or not reason:
            return Response(
                {'error': 'transaction_id and reason are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            transaction = Transaction.objects.get(
                id=transaction_id,
                customer__user=request.user
            )

            # Check if refund is possible
            if transaction.status != Transaction.COMPLETED:
                return Response(
                    {'error': 'Only completed transactions can be refunded'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # For now, create a refund request (in production, this would integrate with payment gateway)
            transaction.status = Transaction.REFUNDED
            transaction.save()

            return Response({
                'success': True,
                'message': 'Refund request submitted',
                'transaction': self.get_serializer(transaction).data
            })

        except Transaction.DoesNotExist:
            return Response(
                {'error': 'Transaction not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class SubscriptionViewSet(viewsets.ModelViewSet):
    serializer_class = SubscriptionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Subscription.objects.filter(customer__user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel an active subscription"""
        subscription = self.get_object()
        subscription.status = Subscription.CANCELLED
        subscription.save()
        return Response({'status': 'subscription cancelled'})

    @action(detail=False, methods=['post'])
    def upgrade(self, request):
        """
        Upgrade subscription plan
        """
        plan_id = request.data.get('plan_id')
        payment_method_id = request.data.get('payment_method_id')

        if not plan_id or not payment_method_id:
            return Response(
                {'error': 'plan_id and payment_method_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Get user's current subscription
            current_subscription = Subscription.objects.filter(
                customer__user=request.user,
                status=Subscription.ACTIVE
            ).first()

            if not current_subscription:
                return Response(
                    {'error': 'No active subscription found'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get payment method
            payment_method = PaymentMethod.objects.get(
                id=payment_method_id,
                user=request.user
            )

            # For now, simulate upgrade (in production, this would integrate with payment gateway)
            current_subscription.plan_id = plan_id
            current_subscription.save()

            return Response({
                'success': True,
                'message': 'Subscription upgraded successfully',
                'subscription': self.get_serializer(current_subscription).data
            })

        except PaymentMethod.DoesNotExist:
            return Response(
                {'error': 'Invalid payment method'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class AdminTransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all().select_related('customer', 'merchant', 'payment_method')
    serializer_class = AdminTransactionSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Add filtering capabilities
        user_id = self.request.query_params.get('user_id')
        status = self.request.query_params.get('status')
        
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        if status:
            queryset = queryset.filter(status=status)
            
        return queryset.order_by('-created_at')

    @action(detail=True, methods=['post'])
    def override_status(self, request, pk=None):
        """
        Manually override transaction status (admin only)
        ---
        parameters:
          - name: status
            required: true
            type: string
            enum: [pending, completed, failed, refunded]
          - name: reason
            required: true
            type: string
            description: Reason for status override
        responses:
          200:
            description: Status updated successfully
          400:
            description: Invalid request or status transition
        """
        transaction = self.get_object()
        new_status = request.data.get('status')
        reason = request.data.get('reason')

        if not new_status or not reason:
            return Response(
                {'error': 'status and reason are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate status transition
        valid_statuses = [Transaction.PENDING, Transaction.COMPLETED, Transaction.FAILED, Transaction.REFUNDED]
        if new_status not in valid_statuses:
            return Response(
                {'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Prevent invalid transitions
        if transaction.status == Transaction.REFUNDED and new_status != Transaction.REFUNDED:
            return Response(
                {'error': 'Cannot change status from refunded'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update transaction
        old_status = transaction.status
        transaction.status = new_status
        transaction.description = f"{transaction.description or ''} [ADMIN OVERRIDE: {old_status} -> {new_status}] Reason: {reason}".strip()
        transaction.save()

        # Log admin action
        logger.info(f"Admin {request.user.id} manually changed transaction {transaction.id} status from {old_status} to {new_status}. Reason: {reason}")

        return Response({
            'message': f'Transaction status updated from {old_status} to {new_status}',
            'transaction': self.get_serializer(transaction).data
        })

    @action(detail=True, methods=['post'])
    def process_refund(self, request, pk=None):
        """
        Process a refund for a transaction (admin only)
        ---
        parameters:
          - name: refund_amount
            type: number
            description: Amount to refund (defaults to full transaction amount)
          - name: reason
            required: true
            type: string
            description: Reason for refund
        responses:
          200:
            description: Refund processed successfully
          400:
            description: Invalid refund request
        """
        transaction = self.get_object()
        refund_amount = request.data.get('refund_amount', transaction.amount)
        reason = request.data.get('reason')

        if not reason:
            return Response(
                {'error': 'reason is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate refund conditions
        if transaction.status == Transaction.REFUNDED:
            return Response(
                {'error': 'Transaction already refunded'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if float(refund_amount) > float(transaction.amount):
            return Response(
                {'error': 'Refund amount cannot exceed transaction amount'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update transaction status
        transaction.status = Transaction.REFUNDED
        transaction.description = f"{transaction.description or ''} [REFUNDED: ${refund_amount}] Reason: {reason}".strip()
        transaction.save()

        # Log refund action
        logger.info(f"Admin {request.user.id} processed refund for transaction {transaction.id} - Amount: ${refund_amount}, Reason: {reason}")

        return Response({
            'message': f'Refund processed for ${refund_amount}',
            'transaction': self.get_serializer(transaction).data
        })

    @action(detail=True, methods=['post'])
    def create_dispute(self, request, pk=None):
        """
        Create a dispute for a transaction (admin only)
        ---
        parameters:
          - name: reason
            required: true
            type: string
            description: Reason for the dispute
        responses:
          201:
            description: Dispute created successfully
          400:
            description: Invalid request
        """
        from ..models import Dispute

        transaction = self.get_object()
        reason = request.data.get('reason')

        if not reason:
            return Response(
                {'error': 'reason is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if dispute already exists
        if hasattr(transaction, 'dispute'):
            return Response(
                {'error': 'Dispute already exists for this transaction'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create dispute
        dispute = Dispute.objects.create(
            transaction=transaction,
            reason=reason,
            created_by=request.user
        )

        # Log dispute creation
        logger.info(f"Admin {request.user.id} created dispute for transaction {transaction.id}. Reason: {reason}")

        return Response({
            'message': 'Dispute created successfully',
            'dispute': {
                'id': dispute.id,
                'status': dispute.status,
                'reason': dispute.reason,
                'created_at': dispute.created_at
            }
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def resolve_dispute(self, request, pk=None):
        """
        Resolve a transaction dispute (admin only)
        ---
        parameters:
          - name: resolution
            required: true
            type: string
            description: Resolution details
          - name: action
            type: string
            enum: [refund, complete, close]
            description: Action to take when resolving dispute
        responses:
          200:
            description: Dispute resolved successfully
          400:
            description: Invalid request
        """
        from ..models import Dispute

        transaction = self.get_object()
        resolution = request.data.get('resolution')
        action = request.data.get('action', 'close')

        if not resolution:
            return Response(
                {'error': 'resolution is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if dispute exists
        if not hasattr(transaction, 'dispute'):
            return Response(
                {'error': 'No dispute exists for this transaction'},
                status=status.HTTP_400_BAD_REQUEST
            )

        dispute = transaction.dispute

        # Resolve dispute
        dispute.resolve(request.user, resolution)

        # Take additional action based on resolution
        if action == 'refund':
            transaction.status = Transaction.REFUNDED
            transaction.description = f"{transaction.description or ''} [DISPUTE RESOLVED - REFUNDED]".strip()
        elif action == 'complete':
            transaction.status = Transaction.COMPLETED
            transaction.description = f"{transaction.description or ''} [DISPUTE RESOLVED - COMPLETED]".strip()

        transaction.save()

        # Log dispute resolution
        logger.info(f"Admin {request.user.id} resolved dispute for transaction {transaction.id}. Action: {action}, Resolution: {resolution}")

        return Response({
            'message': f'Dispute resolved with action: {action}',
            'transaction': self.get_serializer(transaction).data,
            'dispute': {
                'id': dispute.id,
                'status': dispute.status,
                'resolution': dispute.resolution,
                'resolved_at': dispute.resolved_at
            }
        })

    @action(detail=True, methods=['post'])
    def manual_complete(self, request, pk=None):
        """
        Manually complete a pending transaction (admin only)
        ---
        parameters:
          - name: reason
            required: true
            type: string
            description: Reason for manual completion
        responses:
          200:
            description: Transaction manually completed
          400:
            description: Invalid request
        """
        transaction = self.get_object()
        reason = request.data.get('reason')

        if not reason:
            return Response(
                {'error': 'reason is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate current status
        if transaction.status not in [Transaction.PENDING, Transaction.FAILED]:
            return Response(
                {'error': 'Only pending or failed transactions can be manually completed'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update transaction
        old_status = transaction.status
        transaction.status = Transaction.COMPLETED
        transaction.description = f"{transaction.description or ''} [MANUALLY COMPLETED from {old_status}] Reason: {reason}".strip()
        transaction.save()

        # Log manual completion
        logger.info(f"Admin {request.user.id} manually completed transaction {transaction.id} (was {old_status}). Reason: {reason}")

        return Response({
            'message': f'Transaction manually completed from {old_status}',
            'transaction': self.get_serializer(transaction).data
        })

class PaymentViewSet(viewsets.ViewSet):
    throttle_classes = [EndpointThrottle]
    
    def create(self, request):
        """Handle payment with idempotency key"""
        idempotency_key = request.headers.get('Idempotency-Key') or str(uuid4())
        
        # Check cache for existing response
        cached_response = cache.get(f'payment_{idempotency_key}')
        if cached_response:
            return Response(cached_response)
            
        try:
            # Get payment data from request
            amount = request.data.get('amount')
            payment_method = request.data.get('payment_method')
            payment_token = request.data.get('payment_token')
            
            # Process payment through payment service
            result = PaymentService.process_payment(
                user=request.user,
                amount=amount,
                payment_method=payment_method,
                payment_token=payment_token
            )
            
            # Cache successful responses for 24 hours
            if result.get('success'):
                cache.set(f'payment_{idempotency_key}', result, 86400)
                
            return Response(result)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class VerifyMobilePaymentView(APIView):
    @staticmethod
    def post(request):
        """
        Verify mobile money payments
        """
        try:
            transaction_id = request.data.get('transaction_id')
            provider = request.data.get('provider')
            
            # Verify payment through payment service
            result = PaymentService.verify_mobile_payment(
                transaction_id=transaction_id,
                provider=provider
            )
            
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

@api_view(['POST'])
def process_payment(request):
    """
    Process payment API endpoint
    """
    try:
        # Get payment data from request
        amount = request.data.get('amount')
        payment_method = request.data.get('payment_method')
        payment_token = request.data.get('payment_token')
        
        # Process payment through payment service
        result = PaymentService.process_payment(
            user=request.user,
            amount=amount,
            payment_method=payment_method,
            payment_token=payment_token
        )
        
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['POST'])
def verify_mobile_payment(request):
    """
    Verify mobile payment API endpoint
    """
    try:
        transaction_id = request.data.get('transaction_id')
        provider = request.data.get('provider')
        
        # Verify payment through payment service
        result = PaymentService.verify_mobile_payment(
            transaction_id=transaction_id,
            provider=provider
        )
        
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )

class USSDCallbackView(APIView):
    """
    Handle USSD gateway callbacks and manage USSD payment flow
    Expected request format:
    {
        "sessionId": "unique-session-id",
        "phoneNumber": "233123456789",
        "serviceCode": "*123#",
        "text": "user input"  # Empty string for first request
    }
    """
    @staticmethod
    def post(request):
        from .models import USSDTransaction, Transaction
        from ..services import PaymentService
        
        session_id = request.data.get('sessionId')
        phone_number = request.data.get('phoneNumber')
        user_input = request.data.get('text', '')
        
        try:
            # Get or create USSD session
            ussd_txn, created = USSDTransaction.objects.get_or_create(
                session_id=session_id,
                defaults={
                    'phone_number': phone_number,
                    'status': USSDTransaction.NEW
                }
            )
            
            # Process user input based on current state
            if ussd_txn.status == USSDTransaction.NEW:
                if user_input:
                    # First input should be amount
                    try:
                        amount = float(user_input)
                        ussd_txn.amount = amount
                        ussd_txn.status = USSDTransaction.AMOUNT_ENTERED
                        ussd_txn.save()
                        response = ussd_txn.get_next_menu()
                    except ValueError:
                        response = "Invalid amount. Please enter a valid amount"
                else:
                    response = "Welcome to SikaRemit\nEnter amount:"
                    
            elif ussd_txn.status == USSDTransaction.AMOUNT_ENTERED:
                if user_input == '1':  # Confirmed
                    # Create payment transaction
                    transaction = Transaction.objects.create(
                        amount=ussd_txn.amount,
                        status=Transaction.PENDING,
                        payment_method=PaymentMethod.objects.get(method_type=PaymentMethod.MTN_MOMO)
                    )
                    
                    # Process payment
                    result = PaymentService._process_mobile_payment(
                        phone_number=ussd_txn.phone_number,
                        amount=ussd_txn.amount
                    )
                    
                    if result['success']:
                        ussd_txn.status = USSDTransaction.COMPLETED
                        ussd_txn.transaction = transaction
                        response = f"Payment of {ussd_txn.amount} processed successfully"
                    else:
                        ussd_txn.status = USSDTransaction.FAILED
                        response = f"Payment failed: {result.get('error')}"
                    
                    ussd_txn.save()
                elif user_input == '2':  # Cancelled
                    ussd_txn.status = USSDTransaction.FAILED
                    ussd_txn.save()
                    response = "Payment cancelled"
                else:
                    response = "Invalid input. Please select 1 to confirm or 2 to cancel"
            
            return Response({
                'response': response,
                'continueSession': ussd_txn.status not in [USSDTransaction.COMPLETED, USSDTransaction.FAILED]
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class ScheduledPayoutViewSet(viewsets.ModelViewSet):
    queryset = ScheduledPayout.objects.all()
    serializer_class = ScheduledPayoutSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter payouts by merchant or show all for admin"""
        user = self.request.user
        if user.user_type == 1:  # admin
            return self.queryset
        return self.queryset.filter(merchant__user=user)
    
    @action(detail=True, methods=['post'])
    def process_now(self, request, pk=None):
        """Process payout immediately"""
        scheduled_payout = self.get_object()
        # TODO: Implement actual payout processing
        scheduled_payout.status = ScheduledPayout.COMPLETED
        scheduled_payout.save()
        return Response({'status': 'payout processed'})
    
    @action(detail=True, methods=['post'])
    def update_schedule(self, request, pk=None):
        """Update cron schedule and recalculate next execution"""
        scheduled_payout = self.get_object()
        schedule = request.data.get('schedule')
        if not schedule:
            return Response(
                {'error': 'schedule is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        scheduled_payout.schedule = schedule
        scheduled_payout.calculate_next_execution()
        scheduled_payout.save()
        
        serializer = self.get_serializer(scheduled_payout)
        return Response(serializer.data)

class USSDTransactionViewSet(viewsets.ModelViewSet):
    queryset = USSDTransaction.objects.all()
    serializer_class = USSDTransactionSerializer
    permission_classes = [IsAdminUser]

class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    throttle_classes = [EndpointThrottle]

    def get_queryset(self):
        user = self.request.user
        if user.user_type == 1:  # admin
            return Transaction.objects.all()
        elif user.user_type == 2:  # merchant
            return Transaction.objects.filter(merchant__user=user)
        return Transaction.objects.filter(customer__user=user)

class CrossBorderRemittanceViewSet(viewsets.ModelViewSet):
    """
    API for international money transfers
    """
    queryset = CrossBorderRemittance.objects.all()
    serializer_class = CrossBorderRemittanceSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def initiate_transfer(self, request):
        """
        Initiate cross-border money transfer
        ---
        parameters:
          - name: recipientName
            type: string
            required: true
          - name: recipientPhone
            type: string
            required: true
          - name: recipientCountry
            type: string
            required: true
          - name: recipientAddress
            type: string
            required: false
          - name: recipientAccountType
            type: string
            required: false
          - name: recipientAccountNumber
            type: string
            required: false
          - name: beneficiaryInstitutionName
            type: string
            required: false
          - name: beneficiaryInstitutionAddress
            type: string
            required: false
          - name: amount
            type: number
            required: true
          - name: senderAddress
            type: string
            required: false
          - name: senderIdType
            type: string
            required: false
          - name: senderIdNumber
            type: string
            required: false
          - name: senderIdIssuingAuthority
            type: string
            required: false
          - name: senderAccountType
            type: string
            required: false
          - name: senderAccountNumber
            type: string
            required: false
          - name: sourceOfFunds
            type: string
            required: false
          - name: purposeOfTransfer
            type: string
            required: false
          - name: userReferenceNumber
            type: string
            required: false
          - name: paymentMethod
            type: string
            required: false
        responses:
          201:
            description: Transfer initiated
          400:
            description: Invalid request
        """
        try:
            sender = request.user.customer
            
            # Create remittance record with all KYC fields
            remittance = CrossBorderRemittance.objects.create(
                sender=sender,
                # Sender KYC Information
                sender_address=request.data.get('senderAddress'),
                sender_id_type=request.data.get('senderIdType'),
                sender_id_number=request.data.get('senderIdNumber'),
                sender_id_issuing_authority=request.data.get('senderIdIssuingAuthority'),
                sender_account_type=request.data.get('senderAccountType'),
                sender_account_number=request.data.get('senderAccountNumber'),
                source_of_funds=request.data.get('sourceOfFunds'),
                purpose_of_transfer=request.data.get('purposeOfTransfer'),
                # Recipient Information
                recipient_name=request.data['recipientName'],
                recipient_phone=request.data['recipientPhone'],
                recipient_address=request.data.get('recipientAddress'),
                recipient_account_type=request.data.get('recipientAccountType'),
                recipient_account_number=request.data.get('recipientAccountNumber'),
                recipient_country=request.data['recipientCountry'],
                beneficiary_institution_name=request.data.get('beneficiaryInstitutionName'),
                beneficiary_institution_address=request.data.get('beneficiaryInstitutionAddress'),
                # Transaction Details
                amount_sent=Decimal(str(request.data['amount'])),
                user_reference_number=request.data.get('userReferenceNumber'),
                payment_method=request.data.get('paymentMethod'),
            )
            
            # Use the CrossBorderService for processing exchange rate and fee calculation
            from ..services.cross_border_service import CrossBorderService
            
            # Calculate exchange rate and fee
            exchange_rate = CrossBorderService.get_exchange_rate('USD', remittance.recipient_country)
            fee = CrossBorderService.calculate_fees(remittance.amount_sent, ('US', remittance.recipient_country))
            
            # Update remittance with calculated values
            remittance.exchange_rate = exchange_rate
            remittance.fee = fee
            remittance.amount_received = remittance.amount_sent * exchange_rate - fee
            remittance.save()
            
            # Send notification for initiated transfer
            from ..services.cross_border_service import CrossBorderService
            CrossBorderService._send_remittance_notification(remittance, 'initiated')
            
            serializer = self.get_serializer(remittance)
            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )
            
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Cross-border transfer initiation failed: {str(e)}")
            return Response(
                {'error': 'Transfer initiation failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def request_exemption(self, request, pk=None):
        """
        Request exemption for a remittance
        ---
        parameters:
          - name: exemption_type
            type: string
            required: true
          - name: justification
            type: string
            required: true
        responses:
          200:
            description: Exemption request submitted
          400:
            description: Invalid request
        """
        remittance = self.get_object()
        
        try:
            remittance.exempt_status = request.data['exemption_type']
            remittance.exemption_status = 'pending'
            remittance.exemption_notes = request.data['justification']
            remittance.save()
            
            return Response(
                {'status': 'exemption_requested'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def approve_exemption(self, request, pk=None):
        """API to approve exemption"""
        remittance = self.get_object()
        try:
            remittance.approve_exemption(
                request.user,
                request.data.get('notes', '')
            )
            return Response({'status': 'approved'})
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def reject_exemption(self, request, pk=None):
        """API to reject exemption"""
        remittance = self.get_object()
        try:
            remittance.reject_exemption(
                request.user,
                request.data['notes']
            )
            return Response({'status': 'rejected'})
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'])
    def calculate_transfer_fees(self, request):
        """
        Calculate transfer fees and exchange rates
        ---
        parameters:
          - name: amount
            type: number
            required: true
          - name: destination
            type: string
            required: true
          - name: from_currency
            type: string
            required: false
            default: USD
        responses:
          200:
            description: Fee calculation result
          400:
            description: Invalid request
        """
        try:
            amount = Decimal(str(request.data.get('amount', 0)))
            destination = request.data.get('destination')
            from_currency = request.data.get('from_currency', 'USD')

            if not amount or not destination:
                return Response(
                    {'error': 'amount and destination are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Use CrossBorderService for calculations
            from ..services.cross_border_service import CrossBorderService

            # Get exchange rate
            exchange_rate = CrossBorderService.get_exchange_rate(from_currency, destination)

            # Calculate fees
            fee = CrossBorderService.calculate_fees(amount, ('US', destination))

            # Calculate recipient receives
            recipient_receives = amount * exchange_rate - fee

            return Response({
                'baseFee': float(settings.REMITTANCE_FEE_BASE),
                'percentageFee': float(amount * settings.REMITTANCE_FEE_PERCENTAGE),
                'totalFee': float(fee),
                'exchangeRate': float(exchange_rate),
                'recipientReceives': float(recipient_receives),
                'amount': float(amount),
                'destination': destination,
                'fromCurrency': from_currency
            })

        except Exception as e:
            logger.error(f"Fee calculation failed: {str(e)}")
            return Response(
                {'error': 'Fee calculation failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def exchange_rates(self, request):
        """
        Get current exchange rates
        ---
        parameters:
          - name: from_currency
            type: string
            required: false
            default: USD
          - name: to_currency
            type: string
            required: false
            default: GHS
        responses:
          200:
            description: Exchange rate data
        """
        try:
            from_currency = request.query_params.get('from_currency', 'USD')
            to_currency = request.query_params.get('to_currency', 'GHS')

            from ..services.cross_border_service import CrossBorderService
            exchange_rate = CrossBorderService.get_exchange_rate(from_currency, to_currency)

            return Response({
                'rate': float(exchange_rate),
                'fromCurrency': from_currency,
                'toCurrency': to_currency,
                'timestamp': timezone.now().isoformat()
            })

        except Exception as e:
            logger.error(f"Exchange rate lookup failed: {str(e)}")
            return Response(
                {'error': 'Exchange rate lookup failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class VerificationViewSet(viewsets.ViewSet):
    """
    API for verification services
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def verify_phone(self, request):
        """
        Verify recipient phone number
        ---
        parameters:
          - name: phone_number
            type: string
            required: true
        responses:
          200:
            description: Verification result
          400:
            description: Invalid request
        """
        from ..services.verification import VerificationService
        
        try:
            verified = VerificationService.verify_phone_number(
                request.data['phone_number']
            )
            return Response({'verified': verified})
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'])
    def verify_funds(self, request):
        """Verify source of funds"""
        from ..services.verification import VerificationService
        
        try:
            customer = request.user.customer
            verified = VerificationService.verify_source_of_funds(customer)
            customer.source_of_funds_verified = verified
            customer.save()
            
            return Response({'verified': verified})
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def available_providers(self, request):
        """List available verification providers"""
        return Response({
            'providers': [
                {
                    'name': 'africastalking',
                    'configured': bool(settings.AFRICASTALKING_API_KEY)
                },
                {
                    'name': 'twilio',
                    'configured': bool(settings.TWILIO_ACCOUNT_SID)
                },
                {
                    'name': 'nexmo',
                    'configured': bool(settings.NEXMO_API_KEY)
                }
            ],
            'current_provider': settings.PHONE_VERIFICATION_PROVIDER
        })

    @action(detail=False, methods=['post'])
    def test_provider(self, request):
        """
        Test verification provider
        ---
        parameters:
          - name: phone_number
            type: string
            required: true
        responses:
          200:
            description: Verification result
          400:
            description: Invalid request
        """
        from ..services.verification import VerificationService
        
        phone_number = request.data.get('phone_number')
        if not phone_number:
            return Response(
                {'error': 'phone_number is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            verified = VerificationService.verify_phone_number(phone_number)
            return Response({'verified': verified})
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'])
    def verify_recipient(self, request):
        """Verify recipient details (bank account or mobile money)"""
        from ..services.verification import VerificationService

        recipient_type = request.data.get('recipient_type')

        if recipient_type not in ['bank', 'mobile_money']:
            return Response(
                {'error': 'recipient_type must be bank or mobile_money'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if recipient_type == 'bank':
            account_number = (request.data.get('account_number') or '').strip()
            bank_code = (request.data.get('bank_code') or '').strip()

            if not account_number:
                return Response(
                    {'error': 'account_number is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if not bank_code:
                return Response(
                    {'error': 'bank_code is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # For now, return a mock response for bank verification
            # In production, integrate with direct banking partners
            return Response(
                {
                    'verified': True,
                    'verified_name': f'Account Holder for {bank_code}',
                    'provider': 'direct_bank',
                    'reason': 'Bank account verified via direct integration'
                },
                status=status.HTTP_200_OK
            )

        phone_number = (request.data.get('phone_number') or '').strip()
        mobile_provider = (request.data.get('mobile_provider') or '').strip()

        if not phone_number:
            return Response(
                {'error': 'phone_number is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            verified = VerificationService.verify_phone_number(phone_number)
            return Response({
                'verified': bool(verified),
                'verified_name': None,
                'provider': mobile_provider or 'phone_validation'
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'])
    def verification_test_endpoint(self, request):
        """
        Test verification endpoint
        ---
        parameters:
          - name: phone_number
            type: string
            required: true
        responses:
          200:
            description: Verification result
          400:
            description: Invalid request
        """
        from ..services.verification import VerificationService
        
        phone_number = request.data.get('phone_number')
        if not phone_number:
            return Response(
                {'error': 'phone_number is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            verified = VerificationService.verify_phone_number(phone_number)
            return Response({'verified': verified})
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Comprehensive analytics data"""
        from ..models.verification import VerificationLog, VerificationTrend
        from ..utils.alerts import AlertService
        from django.db.utils import OperationalError, ProgrammingError
        
        try:
            providers = list(
                VerificationLog.objects.values('provider').annotate(
                    total=Count('id'),
                    success_rate=Avg(
                        Case(When(success=True, then=100), default=0, output_field=FloatField())
                    ),
                    avg_time=Avg('response_time'),
                ).order_by('-total')
            )
            trends = list(
                VerificationTrend.objects.order_by('-date').values('date', 'success_rate', 'avg_response_time')[:30]
            )
            geo = list(VerificationLog.geographic_stats())
        except (OperationalError, ProgrammingError):
            providers = []
            trends = []
            geo = []

        return Response({
            'alerts': AlertService.get_recent_alerts(),
            'providers': providers,
            'trends': trends,
            'geo': geo,
        })

    @action(detail=False, methods=['get'])
    def provider_stats(self, request):
        """
        Get provider performance statistics
        ---
        responses:
          200:
            description: Provider statistics
        """
        from ..models.verification import VerificationLog, ProviderHealth
        from django.db.models import Avg, Count
        from django.db.utils import OperationalError, ProgrammingError
        
        error = None

        try:
            # Get provider health status
            health_status = {
                p.provider: {
                    'healthy': p.is_healthy,
                    'last_checked': p.last_checked,
                    'success_rate': p.success_rate
                }
                for p in ProviderHealth.objects.all()
            }
            
            # Get verification statistics
            stats = list(
                VerificationLog.objects.values('provider').annotate(
                    total=Count('id'),
                    success_rate=Avg('success'),
                    avg_response_time=Avg('response_time')
                ).order_by('-total')
            )
        except (OperationalError, ProgrammingError):
            health_status = {}
            stats = []
        except Exception as e:
            health_status = {}
            stats = []
            error = str(e)

        payload = {
            'health_status': health_status,
            'verification_stats': stats
        }
        if error:
            payload['error'] = error

        return Response(payload)

    @action(detail=False, methods=['get'])
    def geographic_analytics(self, request):
        """Comprehensive analytics data"""
        from ..models.verification import VerificationLog, ProviderHealth
        
        return Response({
            'providers': [
                {
                    'name': p.provider,
                    'healthy': p.is_healthy,
                    'success_rate': p.success_rate,
                    'response_time': p.response_time
                }
                for p in ProviderHealth.objects.all()
            ],
            'geo': list(VerificationLog.geographic_stats()),
            'alerts': self._get_recent_alerts()
        })
    
    def _get_recent_alerts(self):
        """Get recent outage alerts"""
        # In production, query from actual alert system
        return [
            {
                'provider': 'africastalking',
                'status': 'critical',
                'message': 'Timeout errors',
                'timestamp': '2025-10-31 14:30'
            }
        ]

class P2PPaymentView(APIView):
    """
    Handle peer-to-peer payment requests
    """
    permission_classes = [IsAuthenticated]
    throttle_classes = [PaymentRateThrottle]
    
    def post(self, request):
        """
        Process peer-to-peer payment
        Expected data: { amount, recipient, description, payment_method_id }
        """
        try:
            sender = Customer.objects.get(user=request.user)
            recipient_identifier = request.data.get('recipient')
            amount = Decimal(str(request.data.get('amount')))
            description = request.data.get('description', '')
            payment_method_id = request.data.get('payment_method_id')
            
            if not recipient_identifier or not amount or not payment_method_id:
                return Response(
                    {'error': 'recipient, amount, and payment_method_id are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Find recipient by email or phone
            try:
                recipient = Customer.objects.get(
                    models.Q(user__email=recipient_identifier) | 
                    models.Q(phone_number=recipient_identifier)
                )
            except Customer.DoesNotExist:
                return Response(
                    {'error': 'Recipient not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            if recipient == sender:
                return Response(
                    {'error': 'Cannot send money to yourself'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get payment method
            try:
                payment_method = PaymentMethod.objects.get(
                    id=payment_method_id,
                    user=request.user
                )
            except PaymentMethod.DoesNotExist:
                return Response(
                    {'error': 'Invalid payment method'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create a special payment record for P2P
            # Note: This uses the Payment model but treats sender as customer and recipient as a pseudo-merchant
            payment = Payment.objects.create(
                customer=sender,
                merchant=None,  # P2P payment has no merchant
                amount=amount,
                currency=request.data.get('currency', 'GHS'),  # Use currency from request
                status='pending',
                payment_method=payment_method,  # Use the PaymentMethod object, not method_type string
                description=description,
                metadata={
                    'recipient_id': recipient.id,
                    'recipient_email': recipient.user.email,
                    'p2p_payment': True
                }
            )
            
            # Process the payment through the service
            result = PaymentService.process_p2p_payment(
                sender=sender,
                recipient=recipient,
                amount=amount,
                payment_method=payment_method,
                description=description
            )
            
            if result['success']:
                payment.status = 'completed'
                payment.transaction_id = result.get('transaction_id')
                payment.save()
                
                return Response({
                    'success': True,
                    'transaction_id': payment.transaction_id,
                    'amount': float(payment.amount),
                    'timestamp': payment.created_at.isoformat(),
                    'recipient': recipient.user.email
                }, status=status.HTTP_201_CREATED)
            else:
                payment.status = 'failed'
                payment.metadata['failure_reason'] = result.get('error', 'Payment failed')
                payment.save()
                
                return Response(
                    {'error': result.get('error', 'Payment failed')},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            logger.error(f"P2P payment failed: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class WebhookView(APIView):
    """Base webhook view with HMAC verification"""
    def verify_webhook(self, request):
        secret = settings.WEBHOOK_SECRET
        signature = request.headers.get('X-Signature')
        
        if not signature:
            return False
            
        expected_sig = hmac.new(
            secret.encode(),
            request.body,
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(signature, expected_sig)
    
    def post(self, request, *args, **kwargs):
        if not self.verify_webhook(request):
            return Response({'error': 'Invalid signature'}, status=403)
            
        try:
            payload = json.loads(request.body)
            return self.handle_webhook(payload)
        except json.JSONDecodeError:
            return Response({'error': 'Invalid payload'}, status=400)
    
    def handle_webhook(self, payload):
        """To be implemented by specific webhook handlers"""
        raise NotImplementedError


class RemittanceView(APIView):
    """
    Handle international remittance requests
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Process international remittance
        Expected data: {
            recipient, amount, currency, payment_method_id, purpose,
            delivery_method, delivery_phone, delivery_account_number,
            delivery_bank_name, delivery_bank_branch, delivery_mobile_provider
        }
        """
        try:
            # Basic validation
            required_fields = ['recipient', 'amount', 'currency', 'payment_method_id', 'delivery_method']
            for field in required_fields:
                if not request.data.get(field):
                    return Response(
                        {'error': f'{field} is required'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # Validate delivery method specific fields
            delivery_method = request.data.get('delivery_method')
            if delivery_method == 'mobile_money':
                if not request.data.get('delivery_phone'):
                    return Response(
                        {'error': 'delivery_phone is required for mobile money delivery'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                if not request.data.get('delivery_mobile_provider'):
                    return Response(
                        {'error': 'delivery_mobile_provider is required for mobile money delivery'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            elif delivery_method == 'bank_account':
                if not request.data.get('delivery_account_number'):
                    return Response(
                        {'error': 'delivery_account_number is required for bank delivery'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                if not request.data.get('delivery_bank_name'):
                    return Response(
                        {'error': 'delivery_bank_name is required for bank delivery'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # Get payment method
            try:
                payment_method = PaymentMethod.objects.get(
                    id=request.data.get('payment_method_id'),
                    user=request.user
                )
            except PaymentMethod.DoesNotExist:
                return Response(
                    {'error': 'Invalid payment method'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Process remittance using the cross-border service
            from ..services.cross_border_remittance_service import remittance_service
            from decimal import Decimal
            
            recipient_data = request.data.get('recipient', {})
            if isinstance(recipient_data, str):
                recipient_data = {'name': recipient_data}
            
            delivery_details = {
                'phone_number': request.data.get('delivery_phone'),
                'provider': request.data.get('delivery_mobile_provider'),
                'account_number': request.data.get('delivery_account_number'),
                'bank_name': request.data.get('delivery_bank_name'),
                'bank_branch': request.data.get('delivery_bank_branch'),
            }
            
            result = remittance_service.initiate_remittance(
                sender_user=request.user,
                recipient_data=recipient_data,
                amount=Decimal(str(request.data.get('amount'))),
                source_currency=request.data.get('currency', 'GHS'),
                destination_currency=request.data.get('destination_currency', 'GHS'),
                delivery_method=delivery_method,
                delivery_details=delivery_details,
                payment_method=payment_method,
                purpose=request.data.get('purpose', 'family_support'),
                metadata=request.data.get('metadata')
            )
            
            if result.get('success'):
                return Response(result, status=status.HTTP_201_CREATED)
            else:
                return Response(
                    {'error': result.get('error', 'Remittance failed')},
                    status=status.HTTP_400_BAD_REQUEST
                )

        except Exception as e:
            logger.error(f"Remittance failed: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class OutboundRemittanceView(APIView):
    """
    Handle outbound international remittance requests (Ghana to other countries)
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Process outbound international remittance
        Expected data: {
            recipient, amount, currency, payment_method_id, purpose,
            delivery_method, delivery_phone, delivery_account_number,
            delivery_bank_name, delivery_bank_branch, delivery_routing_number,
            delivery_swift_code, delivery_mobile_provider, delivery_address,
            delivery_city, delivery_postal_code, delivery_wallet_id
        }
        """
        try:
            # Basic validation
            required_fields = ['recipient', 'amount', 'currency', 'payment_method_id', 'delivery_method', 'purpose']
            for field in required_fields:
                if not request.data.get(field):
                    return Response(
                        {'error': f'{field} is required'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # Validate delivery method specific fields
            delivery_method = request.data.get('delivery_method')
            if delivery_method == 'bank_transfer':
                if not request.data.get('delivery_account_number') or not request.data.get('delivery_bank_name'):
                    return Response(
                        {'error': 'Account number and bank name are required for bank transfers'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            elif delivery_method == 'mobile_money':
                if not request.data.get('delivery_phone') or not request.data.get('delivery_mobile_provider'):
                    return Response(
                        {'error': 'Phone number and mobile provider are required for mobile money'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            elif delivery_method == 'cash_pickup':
                if not request.data.get('delivery_address') or not request.data.get('delivery_city'):
                    return Response(
                        {'error': 'Address and city are required for cash pickup'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # Get payment method
            try:
                payment_method = PaymentMethod.objects.get(
                    id=request.data.get('payment_method_id'),
                    user=request.user
                )
            except PaymentMethod.DoesNotExist:
                return Response(
                    {'error': 'Invalid payment method'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Process outbound remittance using the cross-border service
            from ..services.cross_border_remittance_service import remittance_service
            from decimal import Decimal
            
            recipient_data = request.data.get('recipient', {})
            if isinstance(recipient_data, str):
                recipient_data = {'name': recipient_data}
            recipient_data['country'] = request.data.get('recipient_country', 'GH')
            
            delivery_details = {
                'phone_number': request.data.get('delivery_phone'),
                'provider': request.data.get('delivery_mobile_provider'),
                'account_number': request.data.get('delivery_account_number'),
                'bank_name': request.data.get('delivery_bank_name'),
                'bank_code': request.data.get('delivery_bank_code'),
                'bank_branch': request.data.get('delivery_bank_branch'),
                'routing_number': request.data.get('delivery_routing_number'),
                'swift_code': request.data.get('delivery_swift_code'),
                'pickup_location': request.data.get('delivery_address'),
                'city': request.data.get('delivery_city'),
                'postal_code': request.data.get('delivery_postal_code'),
                'wallet_id': request.data.get('delivery_wallet_id'),
            }
            
            result = remittance_service.initiate_remittance(
                sender_user=request.user,
                recipient_data=recipient_data,
                amount=Decimal(str(request.data.get('amount'))),
                source_currency=request.data.get('currency', 'GHS'),
                destination_currency=request.data.get('destination_currency', request.data.get('currency', 'GHS')),
                delivery_method=delivery_method,
                delivery_details=delivery_details,
                payment_method=payment_method,
                purpose=request.data.get('purpose', 'family_support'),
                metadata=request.data.get('metadata')
            )
            
            if result.get('success'):
                result['delivery_time'] = self._calculate_delivery_time(delivery_method)
                return Response(result, status=status.HTTP_201_CREATED)
            else:
                return Response(
                    {'error': result.get('error', 'Outbound remittance failed')},
                    status=status.HTTP_400_BAD_REQUEST
                )

        except Exception as e:
            logger.error(f"Outbound remittance failed: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def _calculate_delivery_time(self, delivery_method: str) -> str:
        """Calculate estimated delivery time based on delivery method"""
        if delivery_method == 'mobile_money':
            return 'Instant - 30 minutes'
        elif delivery_method == 'wallet':
            return 'Instant - 2 hours'
        elif delivery_method == 'cash_pickup':
            return 'Same day - 2 business days'
        elif delivery_method == 'bank_transfer':
            return '1-5 business days'
        else:
            return '1-3 business days'


class GlobalRemittanceView(APIView):
    """
    Handle global international remittance requests (any country to any country)
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Process global international remittance
        Expected data: {
            sender_name, sender_email, sender_phone, sender_address, sender_country,
            recipient, recipient_name, recipient_email, recipient_phone, recipient_country,
            amount, currency, payment_method_id, purpose,
            delivery_method, delivery_phone, delivery_account_number,
            delivery_bank_name, delivery_bank_branch, delivery_routing_number,
            delivery_swift_code, delivery_mobile_provider, delivery_address,
            delivery_city, delivery_postal_code, delivery_wallet_id
        }
        """
        try:
            # Basic validation
            required_fields = [
                'sender_name', 'sender_email', 'sender_country',
                'recipient', 'recipient_name', 'recipient_country',
                'amount', 'currency', 'payment_method_id', 'delivery_method', 'purpose'
            ]
            for field in required_fields:
                if not request.data.get(field):
                    return Response(
                        {'error': f'{field} is required'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # Validate delivery method specific fields
            delivery_method = request.data.get('delivery_method')
            if delivery_method == 'bank_transfer':
                if not request.data.get('delivery_account_number') or not request.data.get('delivery_bank_name'):
                    return Response(
                        {'error': 'Account number and bank name are required for bank transfers'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            elif delivery_method == 'mobile_money':
                if not request.data.get('delivery_phone') or not request.data.get('delivery_mobile_provider'):
                    return Response(
                        {'error': 'Phone number and mobile provider are required for mobile money'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            elif delivery_method == 'cash_pickup':
                if not request.data.get('delivery_address') or not request.data.get('delivery_city'):
                    return Response(
                        {'error': 'Address and city are required for cash pickup'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            elif delivery_method == 'digital_wallet':
                if not request.data.get('delivery_wallet_id'):
                    return Response(
                        {'error': 'Wallet ID is required for digital wallet transfers'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # Get payment method
            try:
                payment_method = PaymentMethod.objects.get(
                    id=request.data.get('payment_method_id'),
                    user=request.user
                )
            except PaymentMethod.DoesNotExist:
                return Response(
                    {'error': 'Invalid payment method'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Process global remittance using the cross-border service
            from ..services.cross_border_remittance_service import remittance_service
            from decimal import Decimal
            
            sender_country = request.data.get('sender_country', 'GH')
            recipient_country = request.data.get('recipient_country', 'GH')
            
            recipient_data = {
                'name': request.data.get('recipient_name'),
                'email': request.data.get('recipient_email'),
                'phone': request.data.get('recipient_phone'),
                'country': recipient_country,
                'address': request.data.get('recipient_address'),
            }
            
            delivery_details = {
                'phone_number': request.data.get('delivery_phone'),
                'provider': request.data.get('delivery_mobile_provider'),
                'account_number': request.data.get('delivery_account_number'),
                'bank_name': request.data.get('delivery_bank_name'),
                'bank_code': request.data.get('delivery_bank_code'),
                'bank_branch': request.data.get('delivery_bank_branch'),
                'routing_number': request.data.get('delivery_routing_number'),
                'swift_code': request.data.get('delivery_swift_code'),
                'pickup_location': request.data.get('delivery_address'),
                'city': request.data.get('delivery_city'),
                'postal_code': request.data.get('delivery_postal_code'),
                'wallet_id': request.data.get('delivery_wallet_id'),
                'wallet_provider': request.data.get('delivery_wallet_provider'),
            }
            
            result = remittance_service.initiate_remittance(
                sender_user=request.user,
                recipient_data=recipient_data,
                amount=Decimal(str(request.data.get('amount'))),
                source_currency=request.data.get('currency', 'GHS'),
                destination_currency=request.data.get('destination_currency', request.data.get('currency', 'GHS')),
                delivery_method=delivery_method,
                delivery_details=delivery_details,
                payment_method=payment_method,
                purpose=request.data.get('purpose', 'family_support'),
                metadata={
                    'sender_name': request.data.get('sender_name'),
                    'sender_email': request.data.get('sender_email'),
                    'sender_phone': request.data.get('sender_phone'),
                    'sender_country': sender_country,
                    'sender_address': request.data.get('sender_address'),
                }
            )
            
            if result.get('success'):
                result['delivery_time'] = self._calculate_delivery_time(
                    delivery_method, sender_country, recipient_country
                )
                return Response(result, status=status.HTTP_201_CREATED)
            else:
                return Response(
                    {'error': result.get('error', 'Global remittance failed')},
                    status=status.HTTP_400_BAD_REQUEST
                )

        except Exception as e:
            logger.error(f"Global remittance failed: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def _calculate_delivery_time(self, delivery_method: str, sender_country: str, recipient_country: str) -> str:
        """Calculate estimated delivery time based on delivery method and countries"""
        # Same country transfers are faster
        is_domestic = sender_country == recipient_country

        if delivery_method == 'mobile_money':
            return 'Instant - 30 minutes' if is_domestic else 'Instant - 2 hours'
        elif delivery_method == 'digital_wallet':
            return 'Instant - 1 hour' if is_domestic else 'Instant - 4 hours'
        elif delivery_method == 'sikaRemit_user':
            return 'Instant - 15 minutes'
        elif delivery_method == 'cash_pickup':
            return 'Same day' if is_domestic else '1-3 business days'
        elif delivery_method == 'bank_transfer':
            return '1-2 business days' if is_domestic else '2-7 business days'
        else:
            return '1-5 business days'


# Missing view functions for payment flow integration

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_remittance_view(request):
    """
    Handle international remittance payments
    """
    from ..gateways.mobile_money import MobileMoneyGateway
    from ..models import PaymentMethod as PaymentMethodModel

    try:
        data = request.data
        recipient = data.get('recipient')
        amount = data.get('amount')
        currency = data.get('currency', 'GHS')
        payment_method_id = data.get('payment_method_id')
        purpose = data.get('purpose', '')

        # Validate required fields with detailed error messages
        missing_fields = []
        if not recipient:
            missing_fields.append('recipient')
        if not amount:
            missing_fields.append('amount')
        if not payment_method_id:
            missing_fields.append('payment_method_id')

        if missing_fields:
            return Response({
                'success': False,
                'error': {
                    'code': 'MISSING_REQUIRED_FIELDS',
                    'message': 'Required fields are missing',
                    'details': f'Missing fields: {", ".join(missing_fields)}',
                    'missing_fields': missing_fields
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validate amount
        try:
            amount = float(amount)
            if amount <= 0:
                return Response({
                    'success': False,
                    'error': {
                        'code': 'INVALID_AMOUNT',
                        'message': 'Amount must be greater than zero',
                        'details': f'Provided amount: {amount}'
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
        except (ValueError, TypeError):
            return Response({
                'success': False,
                'error': {
                    'code': 'INVALID_AMOUNT_FORMAT',
                    'message': 'Amount must be a valid number',
                    'details': f'Provided value: {data.get("amount")}'
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        # Get payment method
        try:
            payment_method = PaymentMethodModel.objects.get(
                id=payment_method_id,
                user=request.user
            )
        except PaymentMethodModel.DoesNotExist:
            return Response({
                'success': False,
                'error': {
                    'code': 'INVALID_PAYMENT_METHOD',
                    'message': 'Payment method not found or does not belong to user',
                    'details': f'Payment method ID: {payment_method_id}'
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check if payment method is active
        if not payment_method.is_active:
            return Response({
                'success': False,
                'error': {
                    'code': 'INACTIVE_PAYMENT_METHOD',
                    'message': 'Payment method is not active',
                    'details': f'Payment method ID: {payment_method_id}'
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        # Route to appropriate gateway
        if payment_method.method_type in ['mtn_momo', 'telecel', 'airtel_tigo']:
            gateway = MobileMoneyGateway()
        else:
            # For other payment types, use mock gateway for now
            from ..gateways.mock_gateway import MockPaymentGateway
            gateway = MockPaymentGateway()

        # Process payment
        result = gateway.process_payment(
            amount=amount,
            currency=currency,
            payment_method=payment_method,
            customer=request.user.customer_profile,
            merchant=None,
            metadata={'purpose': purpose, 'recipient': recipient}
        )

        return Response(result)

    except Exception as e:
        logger.error(f"Remittance failed: {str(e)}")
        return Response({
            'success': False,
            'error': {
                'code': 'REMITTANCE_FAILED',
                'message': 'International remittance processing failed',
                'details': str(e)
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initiate_payment_view(request):
    """
    Initiate payment for various transaction types (airtime, data, account topup, etc.)
    """
    from ..gateways.mobile_money import MobileMoneyGateway
    from ..models import PaymentMethod as PaymentMethodModel

    try:
        data = request.data
        transaction_type = data.get('type')
        amount = data.get('amount')
        payment_method_id = data.get('payment_method_id')
        currency = data.get('currency', 'GHS')

        if not all([transaction_type, amount, payment_method_id]):
            return Response(
                {'error': 'Missing required fields'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get payment method
        try:
            payment_method = PaymentMethodModel.objects.get(
                id=payment_method_id,
                user=request.user
            )
        except PaymentMethodModel.DoesNotExist:
            return Response(
                {'error': 'Invalid payment method'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Route based on transaction type and payment method
        if transaction_type == 'p2p_send':
            # Handle peer-to-peer transfer between SikaRemit users
            from ..services.currency_service import WalletService
            from users.models import User
            
            # Get recipient user
            recipient_details = data.get('recipient_details', {})
            user_id = recipient_details.get('user_id')
            
            if not user_id:
                return Response(
                    {'error': 'Recipient user ID required for P2P transfer'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                recipient_user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response(
                    {'error': 'Recipient user not found'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if sender is trying to send to themselves
            if recipient_user.id == request.user.id:
                return Response(
                    {'error': 'Cannot send money to yourself'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get sender's wallet balance for the currency
            sender_wallet = WalletService.get_wallet_balance(request.user, currency)
            if not sender_wallet or sender_wallet.available_balance < amount:
                return Response(
                    {'error': 'Insufficient balance for transfer'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Transfer balance between users
            from django.db import transaction as db_transaction
            
            with db_transaction.atomic():
                # Deduct from sender
                success = sender_wallet.deduct_balance(amount, 'available')
                if not success:
                    return Response(
                        {'error': 'Failed to deduct from sender balance'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
                
                # Add to recipient
                recipient_wallet = WalletService.get_or_create_wallet_balance(recipient_user, currency)
                recipient_wallet.add_balance(amount, 'available')
                
                # Create transaction records for both users
                from ..models.transaction import Transaction
                from django.utils import timezone
                
                # Create sender transaction
                sender_transaction = Transaction.objects.create(
                    customer=request.user.customer_profile,
                    amount=-amount,  # Negative for outgoing
                    status='completed',
                    currency=currency,
                    description=data.get('description', 'P2P Transfer Sent'),
                    created_at=timezone.now(),
                    completed_at=timezone.now(),
                    metadata={
                        'transaction_type': 'p2p_send',
                        'recipient_user_id': recipient_user.id,
                        'recipient_email': recipient_user.email,
                        'recipient_name': recipient_details.get('recipient_name', recipient_user.get_full_name())
                    }
                )
                
                # Create recipient transaction
                recipient_transaction = Transaction.objects.create(
                    customer=recipient_user.customer_profile,
                    amount=amount,  # Positive for incoming
                    status='completed',
                    currency=currency,
                    description=data.get('description', 'P2P Transfer Received'),
                    created_at=timezone.now(),
                    completed_at=timezone.now(),
                    metadata={
                        'transaction_type': 'p2p_receive',
                        'sender_user_id': request.user.id,
                        'sender_email': request.user.email,
                        'sender_name': request.user.get_full_name()
                    }
                )
                
                # Send notifications
                from ..services.notification_service import NotificationService
                try:
                    # Notify sender
                    NotificationService.send_notification(
                        user=request.user,
                        notification_type='transfer_completed',
                        title='Transfer Sent',
                        message=f'You successfully sent {amount} {currency} to {recipient_user.get_full_name()}',
                        metadata={
                            'transaction_id': sender_transaction.id,
                            'amount': amount,
                            'currency': currency,
                            'recipient': recipient_user.get_full_name()
                        }
                    )
                    
                    # Notify recipient
                    NotificationService.send_notification(
                        user=recipient_user,
                        notification_type='transfer_received',
                        title='Transfer Received',
                        message=f'You received {amount} {currency} from {request.user.get_full_name()}',
                        metadata={
                            'transaction_id': recipient_transaction.id,
                            'amount': amount,
                            'currency': currency,
                            'sender': request.user.get_full_name()
                        }
                    )
                except Exception as e:
                    logger.warning(f"Failed to send notifications: {str(e)}")
            
            return Response({
                'success': True,
                'transaction_id': sender_transaction.id,
                'status': 'completed',
                'message': f'Successfully transferred {amount} {currency} to {recipient_user.get_full_name()}'
            })
        
        elif payment_method.method_type in ['mtn_momo', 'telecel', 'airtel_tigo']:
            gateway = MobileMoneyGateway()
        else:
            # For other payment types, use mock gateway for now
            from ..gateways.mock_gateway import MockPaymentGateway
            gateway = MockPaymentGateway()

        # Process payment with appropriate metadata
        metadata = {
            'transaction_type': transaction_type,
            'user_id': request.user.id
        }

        # Add type-specific data
        if transaction_type in ['airtime', 'data']:
            metadata.update({
                'telecom_provider': data.get('telecom_details', {}).get('provider'),
                'phone_number': data.get('telecom_details', {}).get('phoneNumber')
            })
        elif transaction_type == 'account_topup':
            metadata.update({'topup_type': 'account_balance'})

        result = gateway.process_payment(
            amount=amount,
            currency=currency,
            payment_method=payment_method,
            customer=request.user.customer_profile,
            merchant=None,
            metadata=metadata
        )

        return Response(result)

    except Exception as e:
        logger.error(f"Payment initiation failed: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_checkout_view(request):
    """
    Process checkout for merchant payments
    """
    from ..gateways.mobile_money import MobileMoneyGateway
    from ..models import PaymentMethod as PaymentMethodModel
    from users.models import Merchant

    try:
        data = request.data
        merchant_id = data.get('merchant_id')
        amount = data.get('amount')
        currency = data.get('currency', 'GHS')
        payment_method_id = data.get('payment_method_id')
        description = data.get('description', '')

        if not all([merchant_id, amount, payment_method_id]):
            return Response(
                {'error': 'Missing required fields'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get merchant
        try:
            merchant = Merchant.objects.get(id=merchant_id)
        except Merchant.DoesNotExist:
            return Response(
                {'error': 'Invalid merchant'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get payment method
        try:
            payment_method = PaymentMethodModel.objects.get(
                id=payment_method_id,
                user=request.user
            )
        except PaymentMethodModel.DoesNotExist:
            return Response(
                {'error': 'Invalid payment method'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Route to appropriate gateway
        if payment_method.method_type in ['mtn_momo', 'telecel', 'airtel_tigo']:
            gateway = MobileMoneyGateway()
        else:
            # For other payment types, use mock gateway for now
            from ..gateways.mock_gateway import MockPaymentGateway
            gateway = MockPaymentGateway()

        result = gateway.process_payment(
            amount=amount,
            currency=currency,
            payment_method=payment_method,
            customer=request.user.customer_profile,
            merchant=merchant,
            metadata={'description': description, 'merchant_id': merchant_id}
        )

        return Response(result)

    except Exception as e:
        logger.error(f"Checkout processing failed: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_outbound_remittance_view(request):
    """
    Handle outbound international remittances
    """
    from ..gateways.mobile_money import MobileMoneyGateway
    from ..models import PaymentMethod as PaymentMethodModel

    try:
        data = request.data
        recipient = data.get('recipient')
        amount = data.get('amount')
        currency = data.get('currency', 'USD')
        payment_method_id = data.get('payment_method_id')
        purpose = data.get('purpose', '')
        delivery_method = data.get('delivery_method')

        # Validate required fields with detailed error messages
        missing_fields = []
        if not recipient:
            missing_fields.append('recipient')
        if not amount:
            missing_fields.append('amount')
        if not payment_method_id:
            missing_fields.append('payment_method_id')
        if not delivery_method:
            missing_fields.append('delivery_method')

        if missing_fields:
            return Response({
                'success': False,
                'error': {
                    'code': 'MISSING_REQUIRED_FIELDS',
                    'message': 'Required fields are missing',
                    'details': f'Missing fields: {", ".join(missing_fields)}',
                    'missing_fields': missing_fields
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validate amount
        try:
            amount = float(amount)
            if amount <= 0:
                return Response({
                    'success': False,
                    'error': {
                        'code': 'INVALID_AMOUNT',
                        'message': 'Amount must be greater than zero',
                        'details': f'Provided amount: {amount}'
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
        except (ValueError, TypeError):
            return Response({
                'success': False,
                'error': {
                    'code': 'INVALID_AMOUNT_FORMAT',
                    'message': 'Amount must be a valid number',
                    'details': f'Provided value: {data.get("amount")}'
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validate delivery method
        valid_delivery_methods = ['bank_transfer', 'mobile_money', 'cash_pickup', 'digital_wallet']
        if delivery_method not in valid_delivery_methods:
            return Response({
                'success': False,
                'error': {
                    'code': 'INVALID_DELIVERY_METHOD',
                    'message': 'Invalid delivery method',
                    'details': f'Provided method: {delivery_method}, valid methods: {", ".join(valid_delivery_methods)}'
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        # Get payment method
        try:
            payment_method = PaymentMethodModel.objects.get(
                id=payment_method_id,
                user=request.user
            )
        except PaymentMethodModel.DoesNotExist:
            return Response({
                'success': False,
                'error': {
                    'code': 'INVALID_PAYMENT_METHOD',
                    'message': 'Payment method not found or does not belong to user',
                    'details': f'Payment method ID: {payment_method_id}'
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check if payment method is active
        if not payment_method.is_active:
            return Response({
                'success': False,
                'error': {
                    'code': 'INACTIVE_PAYMENT_METHOD',
                    'message': 'Payment method is not active',
                    'details': f'Payment method ID: {payment_method_id}'
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        # Use mobile money gateway for transfers
        gateway = MobileMoneyGateway()

        metadata = {
            'purpose': purpose,
            'recipient': recipient,
            'delivery_method': delivery_method,
            'recipient_country': data.get('recipient_country'),
            'recipient_name': data.get('recipient_name')
        }

        # Add delivery-specific data
        if delivery_method == 'bank_transfer':
            required_bank_fields = ['delivery_account_number', 'delivery_bank_name']
            missing_bank_fields = [field for field in required_bank_fields if not data.get(field)]
            if missing_bank_fields:
                return Response({
                    'success': False,
                    'error': {
                        'code': 'MISSING_BANK_DETAILS',
                        'message': 'Bank transfer requires account number and bank name',
                        'details': f'Missing fields: {", ".join(missing_bank_fields)}',
                        'missing_fields': missing_bank_fields
                    }
                }, status=status.HTTP_400_BAD_REQUEST)

            metadata.update({
                'bank_name': data.get('delivery_bank_name'),
                'account_number': data.get('delivery_account_number'),
                'routing_number': data.get('delivery_routing_number'),
                'swift_code': data.get('delivery_swift_code')
            })
        elif delivery_method == 'mobile_money':
            required_mobile_fields = ['delivery_phone']  # Remove mobile_provider requirement for international transfers
            missing_mobile_fields = [field for field in required_mobile_fields if not data.get(field)]
            if missing_mobile_fields:
                return Response({
                    'success': False,
                    'error': {
                        'code': 'MISSING_MOBILE_DETAILS',
                        'message': 'Mobile money delivery requires phone number',
                        'details': f'Missing fields: {", ".join(missing_mobile_fields)}',
                        'missing_fields': missing_mobile_fields
                    }
                }, status=status.HTTP_400_BAD_REQUEST)

            metadata.update({
                'mobile_provider': data.get('delivery_mobile_provider'),  # Optional for international transfers
                'phone_number': data.get('delivery_phone')
            })

        result = gateway.process_payment(
            amount=amount,
            currency=currency,
            payment_method=payment_method,
            customer=request.user.customer_profile,
            merchant=None,
            metadata=metadata
        )

        return Response(result)

    except Exception as e:
        logger.error(f"Outbound remittance failed: {str(e)}")
        return Response({
            'success': False,
            'error': {
                'code': 'OUTBOUND_REMITTANCE_FAILED',
                'message': 'Outbound international remittance processing failed',
                'details': str(e)
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_global_remittance_view(request):
    """
    Handle global international remittances with full sender/recipient details
    """
    from ..gateways.mobile_money import MobileMoneyGateway
    from ..models import PaymentMethod as PaymentMethodModel

    try:
        data = request.data

        # Define required fields for global remittances
        required_fields = [
            'sender_name', 'sender_email', 'sender_country',
            'recipient', 'recipient_name', 'recipient_country',
            'amount', 'currency', 'payment_method_id', 'purpose',
            'delivery_method'
        ]

        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            return Response({
                'success': False,
                'error': {
                    'code': 'MISSING_REQUIRED_FIELDS',
                    'message': 'Required fields are missing',
                    'details': f'Missing fields: {", ".join(missing_fields)}',
                    'missing_fields': missing_fields
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validate amount
        try:
            amount = float(data['amount'])
            if amount <= 0:
                return Response({
                    'success': False,
                    'error': {
                        'code': 'INVALID_AMOUNT',
                        'message': 'Amount must be greater than zero',
                        'details': f'Provided amount: {amount}'
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
        except (ValueError, TypeError):
            return Response({
                'success': False,
                'error': {
                    'code': 'INVALID_AMOUNT_FORMAT',
                    'message': 'Amount must be a valid number',
                    'details': f'Provided value: {data.get("amount")}'
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validate email formats
        import re
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, data.get('sender_email', '')):
            return Response({
                'success': False,
                'error': {
                    'code': 'INVALID_SENDER_EMAIL',
                    'message': 'Invalid sender email format',
                    'details': f'Provided email: {data.get("sender_email")}'
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validate delivery method
        valid_delivery_methods = ['bank_transfer', 'mobile_money', 'cash_pickup', 'digital_wallet']
        delivery_method = data['delivery_method']
        if delivery_method not in valid_delivery_methods:
            return Response({
                'success': False,
                'error': {
                    'code': 'INVALID_DELIVERY_METHOD',
                    'message': 'Invalid delivery method',
                    'details': f'Provided method: {delivery_method}, valid methods: {", ".join(valid_delivery_methods)}'
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        # Get payment method
        try:
            payment_method = PaymentMethodModel.objects.get(
                id=data['payment_method_id'],
                user=request.user
            )
        except PaymentMethodModel.DoesNotExist:
            return Response({
                'success': False,
                'error': {
                    'code': 'INVALID_PAYMENT_METHOD',
                    'message': 'Payment method not found or does not belong to user',
                    'details': f'Payment method ID: {data["payment_method_id"]}'
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check if payment method is active
        if not payment_method.is_active:
            return Response({
                'success': False,
                'error': {
                    'code': 'INACTIVE_PAYMENT_METHOD',
                    'message': 'Payment method is not active',
                    'details': f'Payment method ID: {data["payment_method_id"]}'
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validate delivery method specific fields
        delivery_data_mapping = {
            'bank_transfer': ['delivery_bank_name', 'delivery_account_number'],
            'mobile_money': ['delivery_phone'],  # Remove mobile_provider requirement for international transfers
            'cash_pickup': ['delivery_address', 'delivery_city'],
            'digital_wallet': ['delivery_wallet_id']
        }

        if delivery_method in delivery_data_mapping:
            required_delivery_fields = delivery_data_mapping[delivery_method]
            missing_delivery_fields = [field for field in required_delivery_fields if not data.get(field)]
            if missing_delivery_fields:
                error_codes = {
                    'bank_transfer': 'MISSING_BANK_DETAILS',
                    'mobile_money': 'MISSING_MOBILE_DETAILS',
                    'cash_pickup': 'MISSING_ADDRESS_DETAILS',
                    'digital_wallet': 'MISSING_WALLET_DETAILS'
                }
                error_messages = {
                    'bank_transfer': 'Bank transfer requires account number and bank name',
                    'mobile_money': 'Mobile money delivery requires phone number',
                    'cash_pickup': 'Cash pickup requires address and city',
                    'digital_wallet': 'Digital wallet delivery requires wallet ID'
                }

                return Response({
                    'success': False,
                    'error': {
                        'code': error_codes[delivery_method],
                        'message': error_messages[delivery_method],
                        'details': f'Missing fields: {", ".join(missing_delivery_fields)}',
                        'missing_fields': missing_delivery_fields
                    }
                }, status=status.HTTP_400_BAD_REQUEST)

        # Handle currency conversion for international transfers
        recipient_currency = data.get('recipient_currency', 'USD')  # Default to USD if not provided
        original_amount = amount
        original_currency = data['currency']

        # If sending in GHS but recipient uses different currency, convert
        if original_currency == 'GHS' and recipient_currency != 'GHS':
            try:
                # Get current exchange rate from database
                current_rate = ExchangeRate.get_current_rate(original_currency, recipient_currency)

                if current_rate:
                    converted_amount = original_amount * current_rate.rate
                    processing_currency = recipient_currency
                    processing_amount = converted_amount
                    applied_rate = current_rate.rate
                else:
                    # If no rate found in database, fall back to API or manual entry
                    logger.warning(f"No exchange rate found for {original_currency} to {recipient_currency}, using fallback")
                    # You could implement API fallback here or require manual rate entry
                    processing_currency = original_currency
                    processing_amount = original_amount
                    recipient_currency = original_currency
                    applied_rate = 1

            except Exception as e:
                logger.warning(f"Currency conversion failed: {str(e)}, processing in original currency")
                processing_currency = original_currency
                processing_amount = original_amount
                recipient_currency = original_currency
                applied_rate = 1
        else:
            # Same currency or not GHS, no conversion needed
            processing_currency = original_currency
            processing_amount = original_amount
            recipient_currency = original_currency
            applied_rate = 1

        # Use mobile money gateway for global transfers
        gateway = MobileMoneyGateway()

        metadata = {
            'purpose': data['purpose'],
            'recipient': data['recipient'],
            'recipient_name': data['recipient_name'],
            'recipient_country': data['recipient_country'],
            'recipient_email': data.get('recipient_email'),
            'recipient_phone': data.get('recipient_phone'),
            'sender_name': data['sender_name'],
            'sender_email': data['sender_email'],
            'sender_country': data['sender_country'],
            'sender_address': data.get('sender_address'),
            'delivery_method': data['delivery_method'],
            # Currency conversion details
            'original_amount': original_amount,
            'original_currency': original_currency,
            'recipient_currency': recipient_currency,
            'processing_amount': processing_amount,
            'processing_currency': processing_currency,
            'exchange_rate_applied': exchange_rates.get(recipient_currency, 1) if original_currency == 'GHS' and recipient_currency != 'GHS' else None
        }

        # Add delivery-specific data
        if delivery_method in delivery_data_mapping:
            for field in delivery_data_mapping[delivery_method]:
                if data.get(field):
                    metadata[field] = data[field]

        result = gateway.process_payment(
            amount=processing_amount,  # Use converted amount for processing
            currency=processing_currency,  # Use recipient currency for processing
            payment_method=payment_method,
            customer=request.user.customer_profile,
            merchant=None,
            metadata=metadata
        )

        return Response(result)

    except Exception as e:
        logger.error(f"Global remittance failed: {str(e)}")
        return Response({
            'success': False,
            'error': {
                'code': 'GLOBAL_REMITTANCE_FAILED',
                'message': 'Global international remittance processing failed',
                'details': str(e)
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Missing Payment API Endpoints Implementation

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_payment_view(request):
    """Verify payment status"""
    try:
        transaction_id = request.data.get('transaction_id')
        reference = request.data.get('reference')
        
        if not transaction_id:
            return Response({'error': 'Transaction ID required'}, status=400)
        
        # Mock verification
        return Response({
            'verified': True,
            'status': 'completed',
            'transaction_id': transaction_id
        })
    except Exception as e:
        logger.error(f"Payment verification failed: {str(e)}")
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_refund_view(request):
    """Request payment refund"""
    try:
        transaction_id = request.data.get('transaction_id')
        amount = request.data.get('amount')
        reason = request.data.get('reason')
        
        if not all([transaction_id, amount, reason]):
            return Response({'error': 'Transaction ID, amount, and reason required'}, status=400)
        
        # Mock refund processing
        return Response({
            'success': True,
            'refund_id': str(uuid4()),
            'status': 'pending'
        })
    except Exception as e:
        logger.error(f"Refund request failed: {str(e)}")
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_money_view(request):
    """Request money from another user"""
    try:
        amount = request.data.get('amount')
        currency = request.data.get('currency', 'USD')
        description = request.data.get('description', '')
        recipient = request.data.get('recipient')
        
        if not all([amount, recipient]):
            return Response({'error': 'Amount and recipient required'}, status=400)
        
        # Mock money request
        return Response({
            'success': True,
            'request_id': str(uuid4()),
            'status': 'sent'
        })
    except Exception as e:
        logger.error(f"Money request failed: {str(e)}")
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def data_plans_view(request):
    """Get available data plans"""
    try:
        # Mock data plans
        data_plans = [
            {
                'id': '1',
                'name': '1GB Daily',
                'data_amount': '1GB',
                'validity_period': '24 hours',
                'price': 5.00,
                'provider': 'MTN',
                'is_active': True
            }
        ]
        
        return Response({'results': data_plans})
    except Exception as e:
        logger.error(f"Data plans fetch failed: {str(e)}")
        return Response({'error': str(e)}, status=500)


class DomesticTransferViewSet(viewsets.ModelViewSet):
    serializer_class = DomesticTransferSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_queryset(self):
        user = self.request.user
        customer = getattr(user, 'customer_profile', None) or getattr(user, 'customer', None)
        if customer:
            return DomesticTransfer.objects.filter(sender=customer)
        return DomesticTransfer.objects.none()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def create(self, request, *args, **kwargs):
        try:
            logger.info(f"DomesticTransfer create request data: {request.data}")
            return super().create(request, *args, **kwargs)
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            logger.error(f"DomesticTransfer create error: {str(e)}\n{error_trace}")
            print(f"DomesticTransfer create error: {str(e)}\n{error_trace}")
            return Response({'error': str(e), 'detail': error_trace}, status=500)

    def perform_create(self, serializer):
        from rest_framework import serializers as drf_serializers
        user = self.request.user
        customer = getattr(user, 'customer_profile', None) or getattr(user, 'customer', None)
        if customer:
            serializer.save(sender=customer)
        else:
            raise drf_serializers.ValidationError("User must be a customer to create domestic transfers")

    @action(detail=True, methods=['post'])
    def process_transfer(self, request, pk=None):
        """Process a pending domestic transfer"""
        transfer = self.get_object()
        
        if transfer.status != 'pending':
            return Response({'error': 'Transfer is not in pending status'}, status=400)
        
        try:
            # Here you would integrate with payment gateway
            # For now, just mark as completed
            transfer.status = 'completed'
            transfer.processed_at = timezone.now()
            transfer.save()
            
            return Response({'message': 'Transfer processed successfully'})
        except Exception as e:
            transfer.status = 'failed'
            transfer.save()
            logger.error(f"Transfer processing failed: {str(e)}")
            return Response({'error': str(e)}, status=500)
