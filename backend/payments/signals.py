from django.db.models.signals import post_save
from django.dispatch import receiver
from .models.transaction import Transaction
from .models.payment import Payment
from .services.payment_service import PaymentProcessor
from .accounting_integration import AccountingSystem
from .models.cross_border import CrossBorderRemittance
from .webhooks import RemittanceWebhookService

payment_processor = PaymentProcessor()

@receiver(post_save, sender=Transaction)
def register_gateways(sender, instance, created, **kwargs):
    """Register payment gateways when first transaction is created"""
    if created:
        from .gateways.stripe import StripeGateway
        from .gateways.bank_transfer import BankTransferGateway
        from .gateways.coinbase import CoinbaseGateway
        from .gateways.mobile_money import MTNMoMoGateway, TelecelCashGateway, AirtelTigoMoneyGateway
        from .gateways.qr import QRPaymentGateway
        
        payment_processor.register_gateway('stripe', StripeGateway())
        payment_processor.register_gateway('bank_transfer', BankTransferGateway())
        payment_processor.register_gateway('coinbase', CoinbaseGateway())
        payment_processor.register_gateway('mtn_momo', MTNMoMoGateway())
        payment_processor.register_gateway('telecel', TelecelCashGateway())
        payment_processor.register_gateway('airtel_tigo', AirtelTigoMoneyGateway())
        payment_processor.register_gateway('qr', QRPaymentGateway())

@receiver(post_save, sender=Payment)
def auto_sync_to_accounting(sender, instance, created, **kwargs):
    """Automatically sync new payments to accounting system"""
    if created and instance.amount > 0:
        accounting = AccountingSystem()
        accounting.sync_payment(instance)

@receiver(post_save, sender=CrossBorderRemittance)
def handle_exemption_status(sender, instance, **kwargs):
    """Handle exemption status changes"""
    if 'exemption_status' in instance.get_dirty_fields():
        RemittanceWebhookService.send_remittance_notification(
            instance,
            f"exemption_{instance.exemption_status}"
        )
