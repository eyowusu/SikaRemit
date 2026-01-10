from .base import PaymentGateway
import requests
from django.conf import settings
import logging
from django.http import JsonResponse

logger = logging.getLogger(__name__)

class PaystackGateway(PaymentGateway):
    """Paystack payment gateway implementation for African markets"""
    
    signature_header = 'x-paystack-signature'
    
    def __init__(self):
        if not settings.PAYSTACK_SECRET_KEY:
            raise ValueError("Paystack secret key not configured")
        self.base_url = "https://api.paystack.co"
    
    def get_webhook_secret(self):
        return settings.PAYSTACK_WEBHOOK_SECRET
        
    def parse_webhook(self, request):
        """Parse Paystack webhook event"""
        return request.json()
    
    def process_webhook(self, event):
        event_type = event.get('event')
        
        if event_type == 'charge.success':
            return self._handle_payment_success(event)
        elif event_type == 'refund.processed':
            return self._handle_refund(event)
        else:
            return JsonResponse({'status': 'ignored'})
    
    def process_payment(self, amount, currency, payment_method, customer, merchant, metadata=None):
        try:
            # Paystack amounts are in kobo/pesewas (multiply by 100)
            amount_in_kobo = int(amount * 100)
            
            response = requests.post(
                f"{self.base_url}/transaction/initialize",
                headers={
                    "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "email": customer.user.email if customer.user else "test@example.com",
                    "amount": amount_in_kobo,
                    "currency": currency,
                    "metadata": metadata or {},
                    "callback_url": f"{getattr(settings, 'PAYSTACK_CALLBACK_URL', 'http://localhost:3000/paystack/callback')}?reference={payment_method.id}"
                }
            )
            
            if response.status_code == 200:
                return {
                    'success': True,
                    'transaction_id': response.json()['data']['reference'],
                    'authorization_url': response.json()['data']['authorization_url'],
                    'raw_response': response.json()
                }
            else:
                return {
                    'success': False,
                    'error': response.json().get('message'),
                    'raw_response': response.json()
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'raw_response': None
            }
    
    def refund_payment(self, transaction_id, amount=None):
        try:
            payload = {
                "transaction": transaction_id
            }
            if amount:
                payload["amount"] = int(amount * 100)
                
            response = requests.post(
                f"{self.base_url}/refund",
                headers={
                    "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
                    "Content-Type": "application/json"
                },
                json=payload
            )
            
            if response.status_code == 200:
                return {
                    'success': True,
                    'transaction_id': response.json()['data']['reference'],
                    'raw_response': response.json()
                }
            else:
                return {
                    'success': False,
                    'error': response.json().get('message'),
                    'raw_response': response.json()
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'raw_response': None
            }
    
    def _handle_payment_success(self, event):
        """Handle successful payment webhook"""
        # Implementation would update transaction status
        return JsonResponse({'status': 'success'})
    
    def _handle_refund(self, event):
        """Handle refund webhook"""
        # Implementation would update refund status
        return JsonResponse({'status': 'refund_processed'})
