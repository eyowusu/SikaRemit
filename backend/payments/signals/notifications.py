"""
Notification Signals
Django signals for automatic notification sending
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.conf import settings
from payments.models import Transaction, CrossBorderRemittance
from payments.services.notification_service import NotificationService
from users.models import KYCDocument
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Transaction)
def transaction_notification_handler(sender, instance, created, **kwargs):
    """
    Send notifications when transactions are created or updated
    """
    try:
        if created:
            # New transaction created - send initiation notification
            NotificationService.notify_transaction_event(instance, 'initiated')
        else:
            # Transaction updated - check status changes
            if instance.status == 'completed':
                NotificationService.notify_transaction_event(instance, 'completed')
            elif instance.status == 'failed':
                NotificationService.notify_transaction_event(instance, 'failed')
            elif instance.status == 'refunded':
                NotificationService.notify_transaction_event(instance, 'refunded')
    except Exception as e:
        logger.error(f"Transaction notification failed: {str(e)}")


@receiver(post_save, sender=CrossBorderRemittance)
def remittance_notification_handler(sender, instance, created, **kwargs):
    """
    Send notifications for remittance events
    """
    try:
        if created:
            # New remittance initiated
            NotificationService.notify_remittance_event(instance, 'initiated')
        else:
            # Remittance status updated
            if instance.status == 'completed':
                NotificationService.notify_remittance_event(instance, 'completed')
            elif instance.status == 'failed':
                NotificationService.notify_remittance_event(instance, 'failed')
    except Exception as e:
        logger.error(f"Remittance notification failed: {str(e)}")


@receiver(post_save, sender=KYCDocument)
def kyc_notification_handler(sender, instance, created, **kwargs):
    """
    Send notifications for KYC status changes
    """
    try:
        if not created:  # Only for updates
            user = instance.user
            if instance.status == 'approved':
                NotificationService.send_notification(
                    notification_type=NotificationService.KYC_APPROVED,
                    recipient_email=user.email,
                    recipient_phone=getattr(user, 'phone', None),
                    context={'user_name': f"{user.first_name} {user.last_name}"},
                    channels=['email', 'sms']
                )
            elif instance.status == 'rejected':
                NotificationService.send_notification(
                    notification_type=NotificationService.KYC_REJECTED,
                    recipient_email=user.email,
                    recipient_phone=getattr(user, 'phone', None),
                    context={
                        'user_name': f"{user.first_name} {user.last_name}",
                        'rejection_reason': instance.rejection_reason or 'Please check your documents'
                    },
                    channels=['email', 'sms']
                )
    except Exception as e:
        logger.error(f"KYC notification failed: {str(e)}")


# Import signals to ensure they're registered
__all__ = [
    'transaction_notification_handler',
    'remittance_notification_handler',
    'kyc_notification_handler',
]
