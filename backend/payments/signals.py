from django.db.models.signals import post_save
from django.dispatch import receiver
from django.apps import apps
from .services.payment_service import PaymentProcessor
from .accounting_integration import AccountingSystem
from .webhooks import RemittanceWebhookService
import logging

logger = logging.getLogger(__name__)

payment_processor = PaymentProcessor()

def register_gateways(sender, instance, created, **kwargs):
    """Register payment gateways when first transaction is created"""
    if created and not hasattr(payment_processor, '_gateways_registered'):
        from .gateways.stripe import StripeGateway
        from .gateways.bank_transfer import BankTransferGateway
        from .gateways.mobile_money import MTNMoMoGateway, TelecelCashGateway, AirtelTigoMoneyGateway
        from .gateways.qr import QRPaymentGateway
        
        try:
            payment_processor.register_gateway('stripe', StripeGateway())
            payment_processor.register_gateway('bank_transfer', BankTransferGateway())
            payment_processor.register_gateway('mtn_momo', MTNMoMoGateway())
            payment_processor.register_gateway('telecel', TelecelCashGateway())
            payment_processor.register_gateway('airtel_tigo', AirtelTigoMoneyGateway())
            payment_processor.register_gateway('qr', QRPaymentGateway())
            payment_processor._gateways_registered = True
        except Exception as e:
            # Log error but don't fail transaction creation
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to register payment gateways: {str(e)}")

def auto_sync_to_accounting(sender, instance, created, **kwargs):
    """Automatically sync new payments to accounting system"""
    if created and instance.amount > 0:
        accounting = AccountingSystem()
        accounting.sync_payment(instance)

def handle_exemption_status(sender, instance, **kwargs):
    """Handle exemption status changes"""
    # Only process if the instance has an exemption_status field
    if hasattr(instance, 'exemption_status'):
        try:
            # Get the old value from the database if this is an update
            if instance.pk:
                old_instance = sender.objects.get(pk=instance.pk)
                if old_instance.exemption_status != instance.exemption_status:
                    RemittanceWebhookService.send_remittance_notification(
                        instance,
                        f"exemption_{instance.exemption_status}"
                    )
        except sender.DoesNotExist:
            # This is a new instance, don't send notification
            pass
        except Exception as e:
            logger.error(f"Error handling exemption status: {e}")

def connect_signals():
    """Connect signals after Django apps are ready"""
    from django.db.models.signals import post_save
    
    Transaction = apps.get_model('payments', 'Transaction')
    Payment = apps.get_model('payments', 'Payment')
    CrossBorderRemittance = apps.get_model('payments', 'CrossBorderRemittance')
    
    post_save.connect(register_gateways, sender=Transaction)
    post_save.connect(auto_sync_to_accounting, sender=Payment)
    post_save.connect(handle_exemption_status, sender=CrossBorderRemittance)
