"""
Mock Payment Gateway for Testing
"""
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class MockPaymentGateway:
    """Mock payment gateway for testing purposes"""
    
    def __init__(self):
        self.name = "Mock Gateway"
    
    def process_payment(self, amount: float, currency: str, payment_method, customer, merchant=None, metadata=None) -> Dict[str, Any]:
        """
        Mock payment processing - always succeeds for testing
        """
        logger.info(f"Processing mock payment: {amount} {currency} for {customer}")
        
        # Simulate successful payment
        return {
            'success': True,
            'transaction_id': f"MOCK_TXN_{hash(str(payment_method.id) + str(amount))}",
            'status': 'completed',
            'amount': amount,
            'currency': currency,
            'fee': 0,
            'net_amount': amount,
            'message': 'Payment processed successfully (mock)',
            'metadata': metadata or {}
        }
    
    def verify_payment(self, transaction_id: str) -> Dict[str, Any]:
        """Mock payment verification"""
        return {
            'success': True,
            'status': 'completed',
            'transaction_id': transaction_id
        }
    
    def refund_payment(self, transaction_id: str, amount: float, reason: str) -> Dict[str, Any]:
        """Mock payment refund"""
        return {
            'success': True,
            'refund_id': f"MOCK_REFUND_{transaction_id}",
            'amount': amount,
            'status': 'processed',
            'message': 'Refund processed successfully (mock)'
        }
