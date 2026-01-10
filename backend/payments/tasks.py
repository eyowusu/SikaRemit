# payments/tasks.py
from celery import shared_task
from django.core.cache import cache
from .services import PaymentService
from .models.transaction import Transaction
from .models.payment_method import PaymentMethod
from users.models import Customer, Merchant
import logging

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def process_payment_async(self, customer_id, merchant_id, amount, currency, payment_method_id, metadata=None):
    """
    Async task to process payments
    """
    try:
        # Get objects
        customer = Customer.objects.get(user_id=customer_id)
        merchant = Merchant.objects.get(id=merchant_id)
        payment_method = PaymentMethod.objects.get(id=payment_method_id)

        # Process payment
        result = PaymentService.process_payment(
            customer=customer,
            merchant=merchant,
            amount=amount,
            currency=currency,
            payment_method=payment_method,
            metadata=metadata
        )

        logger.info(f"Async payment processed: {result.get('transaction_id', 'unknown')}")
        return result

    except Exception as e:
        logger.error(f"Async payment processing failed: {str(e)}")
        # Retry with exponential backoff
        if self.request.retries < self.max_retries:
            delay = 2 ** self.request.retries  # Exponential backoff
            raise self.retry(countdown=delay, exc=e)
        raise e

@shared_task
def process_scheduled_payments():
    """
    Process scheduled payments that are due
    """
    from django.utils import timezone
    from .models.scheduled_payout import ScheduledPayout

    try:
        # Get due scheduled payments
        due_payments = ScheduledPayout.objects.filter(
            status=ScheduledPayout.PENDING,
            next_execution__lte=timezone.now()
        )

        processed = 0
        for payment in due_payments:
            try:
                # Process the payment
                result = process_payment_async.delay(
                    customer_id=payment.merchant.user.id,
                    merchant_id=payment.merchant.id,
                    amount=payment.amount,
                    currency='USD',
                    payment_method_id=payment.payment_method.id,
                    metadata={'scheduled_payment_id': payment.id}
                )

                payment.status = ScheduledPayout.PROCESSING
                payment.save()
                processed += 1

            except Exception as e:
                logger.error(f"Failed to process scheduled payment {payment.id}: {str(e)}")
                payment.status = ScheduledPayout.FAILED
                payment.save()

        logger.info(f"Processed {processed} scheduled payments")
        return processed

    except Exception as e:
        logger.error(f"Scheduled payment processing error: {str(e)}")
        raise e

@shared_task
def process_webhook_notifications():
    """
    Process pending webhook notifications
    """
    try:
        # Get pending webhook notifications from cache/queue
        # This would typically integrate with a message queue like Redis
        pending_webhooks = cache.get('pending_webhooks', [])

        processed = 0
        for webhook_data in pending_webhooks:
            try:
                # Process webhook (this would call external APIs)
                logger.info(f"Processing webhook notification: {webhook_data.get('type')}")

                # Simulate webhook processing
                # In production, this would call external payment provider APIs

                processed += 1

            except Exception as e:
                logger.error(f"Webhook processing failed: {str(e)}")

        # Clear processed webhooks
        cache.set('pending_webhooks', [], 300)

        logger.info(f"Processed {processed} webhook notifications")
        return processed

    except Exception as e:
        logger.error(f"Webhook notification processing error: {str(e)}")
        raise e
