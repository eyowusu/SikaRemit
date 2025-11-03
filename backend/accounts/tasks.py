from celery import shared_task
from django.core.mail import send_mail
from .models import PaymentLog
from django.conf import settings

def send_payment_receipt(user_id, charge_id):
    payment = PaymentLog.objects.get(
        user_id=user_id,
        stripe_charge_id=charge_id
    )
    
    send_mail(
        'Payment Receipt',
        f'Thank you for your ${payment.amount} payment for {payment.plan} plan',
        'no-reply@payglobe.com',
        [payment.user.email],
        fail_silently=False
    )

@shared_task(bind=True, max_retries=3)
def check_transfer_status(self, payment_id, provider_ref):
    from .banking import BankAPIClient
    from .models import PaymentLog
    
    payment = PaymentLog.objects.get(id=payment_id)
    
    try:
        bank_client = BankAPIClient(api_key=settings.BANK_API_KEY)
        status = bank_client.get_transfer_status(provider_ref)
        
        if status == 'completed':
            payment.status = 'completed'
        elif status == 'failed':
            payment.status = 'failed'
        else:
            # Retry if still processing
            raise self.retry(countdown=60)
            
        payment.save()
    except Exception as e:
        payment.error = str(e)
        payment.save()
        raise self.retry(exc=e, countdown=120)
