from django.db.models.signals import post_save
from django.dispatch import receiver
from payments.models.transaction import Transaction
from .services import NotificationService

@receiver(post_save, sender=Transaction)
def create_transaction_notification(sender, instance, created, **kwargs):
    if created:
        if instance.status == 'completed':
            NotificationService.create_notification(
                user=instance.customer.user,
                title=f"Payment to {instance.merchant.business_name}",
                message=f"Your payment of {instance.amount} {instance.currency} was successful",
                level='payment',
                notification_type='payment_received',
                metadata={
                    'transaction_id': instance.id,
                    'amount': str(instance.amount),
                    'merchant': instance.merchant.business_name
                }
            )
        elif instance.status == 'failed':
            NotificationService.create_notification(
                user=instance.customer.user,
                title=f"Payment Failed",
                message=f"Your payment of {instance.amount} {instance.currency} to {instance.merchant.business_name} failed",
                level='error',
                notification_type='payment_failed',
                metadata={
                    'transaction_id': instance.id,
                    'amount': str(instance.amount),
                    'merchant': instance.merchant.business_name
                }
            )
