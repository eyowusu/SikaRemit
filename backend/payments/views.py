from rest_framework import viewsets
from rest_framework.decorators import action, api_view
from .models.payment_method import PaymentMethod
from .models.transaction import Transaction
from .models.ussd_transaction import USSDTransaction
from .models.subscription import Subscription
from .models.scheduled_payout import ScheduledPayout
from .models.cross_border import CrossBorderRemittance
from .models.verification import VerificationLog
from accounts.models import Customer, Merchant
from .serializers import PaymentMethodSerializer, TransactionSerializer, SubscriptionSerializer, ScheduledPayoutSerializer, USSDTransactionSerializer
from .serializers.cross_border import CrossBorderRemittanceSerializer
from accounts.serializers import BillPaymentSerializer
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from .services import PaymentService
import json
import logging
import traceback
from django.db import models
from django.core.cache import cache
from uuid import uuid4
from rest_framework.throttling import UserRateThrottle
from decimal import Decimal
from django.conf import settings
from django.db.models import Count
from functools import wraps
from django.http import JsonResponse
import hmac
import hashlib
import json

def validate_payment_method(view_func):
    """Decorator to validate payment method before processing"""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        payment_method_id = request.data.get('payment_method_id')
        if not payment_method_id:
            return JsonResponse({'error': 'Payment method required'}, status=400)
            
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

class PaymentRateThrottle(UserRateThrottle):
    """Custom rate limit for payment endpoints"""
    scope = 'payment'
    rate = '30/hour'

class PaymentMethodViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentMethodSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PaymentMethod.objects.filter(user=self.request.user)

class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    throttle_classes = [PaymentRateThrottle]

    def get_queryset(self):
        user = self.request.user
        if user.user_type == 1:  # admin
            return Transaction.objects.all()
        elif user.user_type == 2:  # merchant
            return Transaction.objects.filter(merchant__user=user)
        return Transaction.objects.filter(customer__user=user)

    @action(detail=False, methods=['post'])
    @validate_payment_method
    def process_payment(self, request):
        """
        Process a new payment
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
        try:
            txn = self.get_object()
            amount = float(request.data.get('amount')) if 'amount' in request.data else None
            
            # In a real implementation, this would call payment_processor.refund_payment()
            # For now we'll just update the status
            txn.status = Transaction.REFUNDED
            txn.save()
            
            serializer = self.get_serializer(txn)
            return Response(serializer.data)
            
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
    def analytics(self, request):
        """Comprehensive analytics data"""
        from .models.verification import VerificationLog, VerificationTrend
        from .utils.alerts import AlertService
        
        return Response({
            'alerts': AlertService.get_recent_alerts(),
            'providers': VerificationLog.objects.values('provider').annotate(
                total=Count('id'),
                success_rate=Avg('success')*100,
                avg_time=Avg('response_time')
            ).order_by('-total'),
            'trends': list(
                VerificationTrend.objects
                .order_by('-date')
                .values('date', 'success_rate', 'avg_response_time')[:30]
            ),
            'geo': list(VerificationLog.geographic_stats())
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
        from .models.verification import VerificationLog, ProviderHealth
        from django.db.models import Avg, Count
        
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
        stats = VerificationLog.objects.values('provider').annotate(
            total=Count('id'),
            success_rate=Avg('success'),
            avg_response_time=Avg('response_time')
        ).order_by('-total')
        
        return Response({
            'health_status': health_status,
            'verification_stats': list(stats)
        })

    @action(detail=False, methods=['get'])
    def geographic_analytics(self, request):
        """Comprehensive analytics data"""
        from .models.verification import VerificationLog, ProviderHealth
        
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

class AdminTransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all().select_related('user')
    serializer_class = TransactionSerializer
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

class PaymentView(APIView):
    throttle_classes = [PaymentRateThrottle]
    @staticmethod
    def post(request):
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
        from .services import PaymentService
        
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
                    response = "Welcome to PayGlobe\nEnter amount:"
                    
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

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    throttle_classes = [PaymentRateThrottle]

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
          - name: amount
            type: number
            required: true
        responses:
          201:
            description: Transfer initiated
          400:
            description: Invalid request
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            # Create remittance instance
            remittance = serializer.save(sender=request.user.customer)
            
            # Generate reference number
            import uuid
            remittance.reference_number = f"REM-{uuid.uuid4().hex[:8].upper()}"
            
            # Set amount_sent from amount
            remittance.amount_sent = serializer.validated_data.get('amount_sent', serializer.validated_data.get('amount'))
            
            # Calculate exchange rate and fees (simplified)
            remittance.exchange_rate = Decimal('1.0')  # Would be dynamic
            remittance.fee = remittance.amount_sent * Decimal('0.02')  # 2% fee
            remittance.amount_received = remittance.amount_sent * remittance.exchange_rate - remittance.fee
            
            remittance.save()
            
            return Response(
                self.get_serializer(remittance).data,
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
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
        from .services.verification import VerificationService
        
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
        from .services.verification import VerificationService
        
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
        from .services.verification import VerificationService
        
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
        from .services.verification import VerificationService
        
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
        from .models.verification import VerificationLog, VerificationTrend
        from .utils.alerts import AlertService
        
        return Response({
            'alerts': AlertService.get_recent_alerts(),
            'providers': VerificationLog.objects.values('provider').annotate(
                total=Count('id'),
                success_rate=Avg('success')*100,
                avg_time=Avg('response_time')
            ).order_by('-total'),
            'trends': list(
                VerificationTrend.objects
                .order_by('-date')
                .values('date', 'success_rate', 'avg_response_time')[:30]
            ),
            'geo': list(VerificationLog.geographic_stats())
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
        from .models.verification import VerificationLog, ProviderHealth
        from django.db.models import Avg, Count
        
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
        stats = VerificationLog.objects.values('provider').annotate(
            total=Count('id'),
            success_rate=Avg('success'),
            avg_response_time=Avg('response_time')
        ).order_by('-total')
        
        return Response({
            'health_status': health_status,
            'verification_stats': list(stats)
        })

    @action(detail=False, methods=['get'])
    def geographic_analytics(self, request):
        """Comprehensive analytics data"""
        from .models.verification import VerificationLog, ProviderHealth
        
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
                currency='USD',
                status='pending',
                payment_method=payment_method.method_type,
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
