from django.db import transaction
from ..models.transaction import Transaction
from ..models.payment_method import PaymentMethod
from accounts.models import Customer, Merchant
import logging
from typing import Dict, Optional

logger = logging.getLogger(__name__)

class BasePaymentProcessor:
    """
    Base class for payment processors providing common functionality
    """
    def __init__(self):
        self.gateways: Dict[str, object] = {}
    
    def register_gateway(self, name: str, gateway):
        """Register a payment gateway implementation"""
        self.gateways[name] = gateway
    
    def get_gateway(self, name: str) -> Optional[object]:
        """Retrieve a registered gateway"""
        return self.gateways.get(name)

class PaymentProcessor(BasePaymentProcessor):
    """
    Core payment processing engine that handles:
    - Payment authorization
    - Transaction processing
    - Settlement
    - Refunds
    """
    
    @transaction.atomic
    def process_payment(self, customer, merchant, amount, currency, payment_method, metadata=None):
        """
        Process a payment from customer to merchant
        Returns: Transaction object
        """
        try:
            # Create transaction record
            txn = Transaction.objects.create(
                customer=customer,
                merchant=merchant,
                amount=amount,
                currency=currency,
                payment_method=payment_method,
                status=Transaction.PENDING
            )
            
            # Get appropriate gateway based on payment method
            gateway = self._get_gateway_for_payment_method(payment_method)
            
            # Process payment with gateway
            gateway_response = gateway.process_payment(
                amount=amount,
                currency=currency,
                payment_method=payment_method,
                customer=customer,
                merchant=merchant,
                metadata=metadata
            )
            
            # Update transaction based on gateway response
            if gateway_response['success']:
                txn.status = Transaction.COMPLETED
                txn.save()
                logger.info(f"Payment processed successfully: {txn.id}")
            else:
                txn.status = Transaction.FAILED
                txn.save()
                logger.error(f"Payment failed: {txn.id}. Reason: {gateway_response.get('error')}")
                
            return txn
            
        except Exception as e:
            logger.exception(f"Payment processing failed: {str(e)}")
            raise
    
    def refund_payment(self, transaction, amount=None):
        """
        Process a refund for an existing transaction
        Args:
            transaction: Transaction object to refund
            amount: Optional partial refund amount
        Returns: Updated Transaction object
        """
        try:
            gateway = self._get_gateway_for_payment_method(transaction.payment_method)
            gateway_response = gateway.refund_payment(
                transaction_id=transaction.id,
                amount=amount
            )
            
            if gateway_response['success']:
                transaction.status = Transaction.REFUNDED
                transaction.save()
                logger.info(f"Refund processed successfully: {transaction.id}")
            else:
                logger.error(f"Refund failed: {transaction.id}. Reason: {gateway_response.get('error')}")
                raise ValueError(gateway_response.get('error'))
                
            return transaction
            
        except Exception as e:
            logger.exception(f"Refund processing failed: {str(e)}")
            raise
    
    def _get_gateway_for_payment_method(self, payment_method):
        """Resolve gateway based on payment method type"""
        gateway_name = {
            PaymentMethod.CARD: 'stripe',
            PaymentMethod.BANK: 'bank_transfer',
            PaymentMethod.CRYPTO: 'coinbase',
            PaymentMethod.MTN_MOMO: 'mtn_momo',
            PaymentMethod.TELECEL: 'telecel',
            PaymentMethod.AIRTEL_TIGO: 'airtel_tigo'
        }.get(payment_method.method_type)
        
        if not gateway_name or gateway_name not in self.gateways:
            raise ValueError(f"No gateway configured for payment method: {payment_method.method_type}")
            
        return self.gateways[gateway_name]
