from celery import shared_task
from django.core.mail import send_mail
from .models import PaymentLog
from django.conf import settings
from django.utils import timezone
from .models import PasswordResetToken
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
import logging

logger = logging.getLogger(__name__)

def send_payment_receipt(user_id, charge_id):
    payment = PaymentLog.objects.get(
        user_id=user_id,
        stripe_charge_id=charge_id
    )
    
    send_mail(
        'Payment Receipt',
        f'Thank you for your ${payment.amount} payment for {payment.plan} plan',
        'no-reply@SikaRemit.com',
        [payment.user.email],
        fail_silently=False
    )

@shared_task(bind=True, max_retries=3)
def check_transfer_status(self, payment_id, provider_ref):
    """
    Check bank transfer status and update payment record.
    Retries up to 3 times with exponential backoff.
    """
    from .banking import BankAPIClient
    from .models import PaymentLog
    
    try:
        payment = PaymentLog.objects.get(id=payment_id)
    except PaymentLog.DoesNotExist:
        logger.error(f"Payment {payment_id} not found")
        return
    
    try:
        bank_client = BankAPIClient(api_key=settings.BANK_API_KEY)
        result = bank_client.check_transfer_status(provider_ref)
        
        status = result.get('status', 'unknown')
        
        if status == 'completed':
            payment.status = 'completed'
            payment.completed_at = result.get('completed_at') or timezone.now()
            logger.info(f"Bank transfer {provider_ref} completed for payment {payment_id}")
        elif status in ['failed', 'cancelled']:
            payment.status = 'failed'
            payment.error = result.get('failure_reason', 'Transfer failed')
            logger.warning(f"Bank transfer {provider_ref} failed for payment {payment_id}")
        else:
            # Still processing - retry after 60 seconds
            logger.info(f"Bank transfer {provider_ref} still processing, will retry")
            raise self.retry(countdown=60)
            
        payment.save()
        
    except Exception as e:
        logger.error(f"Error checking transfer status for payment {payment_id}: {str(e)}")
        payment.error = str(e)
        payment.save()
        raise self.retry(exc=e, countdown=120)

@shared_task
def cleanup_expired_tokens():
    """
    Clean up expired password reset tokens and JWT tokens
    """
    try:
        # Clean up expired password reset tokens
        expired_reset_tokens = PasswordResetToken.objects.filter(
            expires_at__lt=timezone.now()
        )
        reset_count = expired_reset_tokens.delete()[0]

        # Clean up expired JWT tokens from blacklist
        expired_jwt_tokens = OutstandingToken.objects.filter(
            expires_at__lt=timezone.now()
        )
        jwt_count = expired_jwt_tokens.delete()[0]

        logger.info(f"Cleaned up {reset_count} expired password reset tokens and {jwt_count} expired JWT tokens")

        return {
            'reset_tokens_cleaned': reset_count,
            'jwt_tokens_cleaned': jwt_count
        }

    except Exception as e:
        logger.error(f"Token cleanup error: {str(e)}")
        raise e
