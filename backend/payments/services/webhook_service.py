import requests
import json
import logging
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Payment

logger = logging.getLogger(__name__)

class WebhookService:
    @staticmethod
    def send_webhook(payment, event_type):
        """
        Send webhook notification for payment status changes
        Args:
            payment: Payment instance
            event_type: Event type (e.g., 'payment_processed', 'status_changed')
        """
        if not settings.WEBHOOK_URL:
            logger.warning("No webhook URL configured")
            return
            
        payload = {
            'event': event_type,
            'payment_id': payment.id,
            'bill_reference': payment.bill_reference,
            'amount': str(payment.amount),
            'status': payment.status,
            'timestamp': payment.updated_at.isoformat()
        }
        
        try:
            response = requests.post(
                settings.WEBHOOK_URL,
                data=json.dumps(payload),
                headers={'Content-Type': 'application/json'},
                timeout=5
            )
            response.raise_for_status()
        except Exception as e:
            logger.error(f"Webhook failed: {str(e)}")

@receiver(post_save, sender=Payment)
def payment_status_change(sender, instance, created, **kwargs):
    """
    Signal handler for payment status changes
    """
    if not created and 'status' in instance.get_dirty_fields():
        WebhookService.send_webhook(
            instance, 
            f"status_changed_to_{instance.status}"
        )
