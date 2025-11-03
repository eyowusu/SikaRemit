from .base import PaymentGateway
import requests
from django.conf import settings

class CoinbaseGateway(PaymentGateway):
    """Coinbase cryptocurrency payment gateway implementation"""
    
    def __init__(self):
        self.api_key = settings.COINBASE_API_KEY
        self.api_version = settings.COINBASE_API_VERSION
        
    def process_payment(self, amount, currency, payment_method, customer, merchant, metadata=None):
        try:
            headers = {
                'Content-Type': 'application/json',
                'X-CC-Api-Key': self.api_key,
                'X-CC-Version': self.api_version
            }
            
            payload = {
                'name': f"Payment to {merchant.business_name}",
                'description': "Payment for goods/services",
                'pricing_type': 'fixed_price',
                'local_price': {
                    'amount': str(amount),
                    'currency': currency
                },
                'metadata': metadata or {},
                'redirect_url': settings.PAYMENT_REDIRECT_URL,
                'cancel_url': settings.PAYMENT_CANCEL_URL
            }
            
            response = requests.post(
                'https://api.commerce.coinbase.com/charges',
                headers=headers,
                json=payload
            )
            
            response.raise_for_status()
            data = response.json()
            
            return {
                'success': True,
                'transaction_id': data['data']['code'],
                'raw_response': data
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'raw_response': response.json() if response else None
            }
    
    def refund_payment(self, transaction_id, amount=None):
        # Cryptocurrency payments are typically non-refundable
        return {
            'success': False,
            'error': 'Cryptocurrency payments cannot be refunded',
            'raw_response': None
        }
