 from django.db import transaction
from .base import BasePaymentService
from ..models import Transaction, Merchant, Payment
from ..services import PaymentProcessor
import logging
from decimal import Decimal

logger = logging.getLogger(__name__)

class RemittanceService(BasePaymentService):
    """
    Handles cross-border remittances including:
    - Payouts to beneficiaries
    - FX conversion
    - Compliance checks
    """
    
    def __init__(self):
        self.payment_processor = PaymentProcessor()
    
    @transaction.atomic
    def process_remittance(self, sender, recipient_info, amount, currency, payment_method, exchange_rate=None):
        """
        Process a remittance payment with remittance-specific fields
        """
        merchant = recipient_info['merchant']
        if not merchant.is_remittance_agent:
            raise ValueError("Merchant must be registered as a remittance agent")
            
        payment = Payment.objects.create(
            customer=sender,
            merchant=merchant,
            amount=amount,
            currency=currency,
            payment_method=payment_method,
            payment_type=Payment.REMITTANCE,
            remittance_reference=recipient_info.get('reference'),
            recipient_country=recipient_info.get('country'),
            recipient_name=recipient_info.get('name'),
            exchange_rate=exchange_rate
        )
        
        try:
            result = self.payment_processor.process(payment)
            payment.status = Payment.COMPLETED if result.success else Payment.FAILED
            payment.save()
            return payment
        except Exception as e:
            payment.status = Payment.FAILED
            payment.save()
            raise
    
    @transaction.atomic
    def send_remittance(self, sender, recipient, amount, source_currency, target_currency, payment_method, agent=None):
        """Process a cross-border remittance"""
        try:
            if agent and not agent.is_remittance_agent:
                raise ValueError("Merchant is not registered as a remittance agent")
                
            # FX conversion
            exchange_rate = self._get_exchange_rate(source_currency, target_currency)
            target_amount = Decimal(amount) * exchange_rate
            
            # Process payment from sender to agent
            txn = self.payment_processor.process_payment(
                customer=sender,
                merchant=agent,
                amount=amount,
                currency=source_currency,
                payment_method=payment_method,
                metadata={
                    'remittance': True,
                    'recipient': recipient,
                    'target_currency': target_currency,
                    'target_amount': float(target_amount)
                }
            )
            
            # Additional compliance checks would go here
            
            return txn
            
        except Exception as e:
            logger.error(f"Remittance failed: {str(e)}")
            raise
    
    def _get_exchange_rate(self, source_currency, target_currency):
        """Get current exchange rate (would integrate with FX provider)"""
        # Placeholder - would call FX API in production
        return Decimal('1.0')
