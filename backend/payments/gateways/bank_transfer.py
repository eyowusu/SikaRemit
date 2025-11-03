from .base import PaymentGateway
import time
from django.conf import settings

class BankTransferGateway(PaymentGateway):
    """Bank transfer payment gateway implementation"""
    
    def process_payment(self, amount, currency, payment_method, customer, merchant, metadata=None):
        # Simulate bank transfer processing delay
        time.sleep(2)
        
        # In a real implementation, this would call a banking API
        return {
            'success': True,
            'transaction_id': f"BANK_{int(time.time())}",
            'raw_response': {
                'amount': amount,
                'currency': currency,
                'merchant_account': merchant.bank_account_number,
                'reference': f"Payment to {merchant.business_name}"
            }
        }
    
    def refund_payment(self, transaction_id, amount=None):
        # Simulate bank transfer processing delay
        time.sleep(2)
        
        return {
            'success': True,
            'transaction_id': f"BANK_REFUND_{int(time.time())}",
            'raw_response': {
                'original_transaction': transaction_id,
                'amount_refunded': amount
            }
        }
