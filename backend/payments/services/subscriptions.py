from django.db import transaction
from django.utils import timezone
from .base import BasePaymentService
from ..models.transaction import Transaction
from ..models.merchant import Merchant
from ..models.subscription import Subscription
from ..services.payment_service import PaymentProcessor
import logging
from datetime import timedelta

logger = logging.getLogger(__name__)

class SubscriptionService(BasePaymentService):
    """
    Handles recurring subscription payments including:
    - Subscription lifecycle management
    - Payment retries
    - Renewal processing
    """
    
    def __init__(self):
        self.payment_processor = PaymentProcessor()
    
    @transaction.atomic
    def create_subscription(self, customer, provider, plan, payment_method, start_date=None):
        """Create a new subscription"""
        try:
            if not provider.is_subscription_provider:
                raise ValueError("Merchant is not registered as a subscription provider")
                
            subscription = Subscription.objects.create(
                customer=customer,
                provider=provider,
                plan=plan,
                payment_method=payment_method,
                start_date=start_date or timezone.now().date(),
                status=Subscription.ACTIVE
            )
            
            # Process initial payment
            self._process_subscription_payment(subscription)
            
            return subscription
            
        except Exception as e:
            logger.error(f"Subscription creation failed: {str(e)}")
            raise
    
    def _process_subscription_payment(self, subscription):
        """Process payment for a subscription"""
        try:
            txn = self.payment_processor.process_payment(
                customer=subscription.customer,
                merchant=subscription.provider,
                amount=subscription.plan['amount'],
                currency=subscription.plan['currency'],
                payment_method=subscription.payment_method,
                metadata={'subscription_id': subscription.id}
            )
            
            if txn.status == Transaction.COMPLETED:
                subscription.last_payment_date = timezone.now().date()
                subscription.next_payment_date = self._calculate_next_payment_date(subscription)
                subscription.save()
            
            return txn
            
        except Exception as e:
            logger.error(f"Subscription payment failed: {str(e)}")
            self._handle_payment_failure(subscription)
            raise
    
    def _calculate_next_payment_date(self, subscription):
        """Calculate next payment date based on plan frequency"""
        frequency = subscription.plan.get('frequency', 'monthly')
        
        if frequency == 'weekly':
            return timezone.now().date() + timedelta(weeks=1)
        elif frequency == 'yearly':
            return timezone.now().date() + timedelta(days=365)
        else:  # monthly
            return timezone.now().date() + timedelta(days=30)
    
    def _handle_payment_failure(self, subscription, retry_count=0):
        """Handle failed subscription payments"""
        max_retries = 3
        
        if retry_count < max_retries:
            # Schedule retry
            pass
        else:
            subscription.status = Subscription.SUSPENDED
            subscription.save()
