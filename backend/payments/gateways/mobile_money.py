from .base import PaymentGateway, CircuitBreakerMixin
from django.conf import settings
import requests
import logging
import time

logger = logging.getLogger(__name__)

class MobileMoneyGateway(PaymentGateway, CircuitBreakerMixin):
    """Base class for mobile money gateways with circuit breaking"""
    PROVIDER_NAME = "generic"
    
    def __init__(self):
        self.api_url = None
        self.auth_token = None
    
    def _make_request(self, endpoint, payload):
        headers = {
            'Authorization': f'Bearer {self.auth_token}',
            'Content-Type': 'application/json'
        }
        
        try:
            response = requests.post(
                f"{self.api_url}{endpoint}",
                json=payload,
                headers=headers,
                timeout=10
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def _make_request_with_retry(self, endpoint, payload):
        return self._circuit_breaker_request(
            lambda: self._make_request(endpoint, payload),
            max_retries=3,
            backoff_factor=1
        )

    def process_payment(self, amount, currency, payment_method, customer, merchant, metadata=None):
        try:
            return self._make_request_with_retry(
                endpoint='/payment',
                payload={
                    'amount': amount,
                    'currency': currency,
                    'customer': customer.id,
                    'merchant': merchant.id
                }
            )
        except Exception as e:
            return {
                'success': False,
                'error': f"Service unavailable: {str(e)}"
            }

class MTNMoMoGateway(PaymentGateway):
    """MTN Mobile Money payment gateway implementation"""
    
    def __init__(self):
        self.api_key = settings.MTN_MOMO_API_KEY
        self.api_secret = settings.MTN_MOMO_API_SECRET
        self.base_url = settings.MTN_MOMO_API_URL
    
    def process_payment(self, amount, currency, payment_method, customer, merchant, metadata=None):
        try:
            # Prepare MTN MoMo API request
            response = requests.post(
                f"{self.base_url}/collection",
                headers={
                    "Authorization": f"Bearer {self._get_auth_token()}",
                    "Content-Type": "application/json"
                },
                json={
                    "amount": str(amount),
                    "currency": currency,
                    "externalId": str(payment_method.id),
                    "payer": {
                        "partyIdType": "MSISDN",
                        "partyId": payment_method.details.get('phone_number')
                    },
                    "payerMessage": f"Payment to {merchant.business_name}",
                    "payeeNote": f"Payment for {metadata.get('description') if metadata else 'goods/services'}"
                }
            )
            
            if response.status_code == 200:
                return {
                    'success': True,
                    'transaction_id': response.json().get('transactionId'),
                    'raw_response': response.json()
                }
            else:
                return {
                    'success': False,
                    'error': response.json().get('message'),
                    'raw_response': response.json()
                }
                
        except Exception as e:
            logger.error(f"MTN MoMo payment failed: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'raw_response': None
            }
    
    def refund_payment(self, transaction_id, amount=None):
        try:
            response = requests.post(
                f"{self.base_url}/refund",
                headers={
                    "Authorization": f"Bearer {self._get_auth_token()}",
                    "Content-Type": "application/json"
                },
                json={
                    "amount": str(amount) if amount else "",
                    "currency": "GHS",
                    "externalId": str(transaction_id),
                    "referenceId": str(transaction_id)
                }
            )
            
            if response.status_code == 200:
                return {
                    'success': True,
                    'transaction_id': response.json().get('transactionId'),
                    'raw_response': response.json()
                }
            else:
                return {
                    'success': False,
                    'error': response.json().get('message'),
                    'raw_response': response.json()
                }
                
        except Exception as e:
            logger.error(f"MTN MoMo refund failed: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'raw_response': None
            }
    
    def _get_auth_token(self):
        """Get OAuth token for MTN API"""
        response = requests.post(
            f"{self.base_url}/token",
            auth=(self.api_key, self.api_secret),
            headers={"Content-Type": "application/json"}
        )
        return response.json().get('access_token')

class TelecelCashGateway(MobileMoneyGateway):
    """Telecel Cash payment gateway"""
    PROVIDER_NAME = "telecel_cash"
    
    def __init__(self):
        super().__init__()
        self.api_url = settings.TELECEL_API_URL
        self.auth_token = settings.TELECEL_API_KEY
    
    def process_payment(self, amount, currency, payment_method, customer, merchant, metadata=None):
        try:
            return self._make_request_with_retry(
                endpoint='/v1/payments',
                payload={
                    'transaction_id': f"TEL_{int(time.time())}",
                    'amount': amount,
                    'recipient': payment_method.details.get('phone_number'),
                    'description': f"Payment to {merchant.business_name}",
                    'callback_url': settings.PAYMENT_CALLBACK_URL
                }
            )
        except Exception as e:
            return {
                'success': False,
                'error': f"Service unavailable: {str(e)}"
            }
    
    def refund_payment(self, transaction_id, amount=None):
        payload = {
            'original_transaction_id': transaction_id,
            'amount': amount,
            'reason': 'Customer refund'
        }
        
        result = self._make_request_with_retry('/v1/refunds', payload)
        
        return {
            'success': result.get('status') == 'SUCCESS',
            'transaction_id': result.get('refund_id', f"TEL_REFUND_{int(time.time())}"),
            'raw_response': result
        }

class AirtelTigoMoneyGateway(MobileMoneyGateway):
    """AirtelTigo Money payment gateway"""
    PROVIDER_NAME = "airtel_tigo"
    
    def __init__(self):
        super().__init__()
        self.api_url = settings.AIRTEL_API_URL
        self.auth_token = settings.AIRTEL_API_KEY
    
    def process_payment(self, amount, currency, payment_method, customer, merchant, metadata=None):
        try:
            return self._make_request_with_retry(
                endpoint='/api/v1/payments/request',
                payload={
                    'customer_msisdn': payment_method.details.get('phone_number'),
                    'amount': amount,
                    'currency': currency,
                    'reference': f"AT_{int(time.time())}",
                    'transaction_desc': f"Payment to {merchant.business_name}"
                }
            )
        except Exception as e:
            return {
                'success': False,
                'error': f"Service unavailable: {str(e)}"
            }
    
    def refund_payment(self, transaction_id, amount=None):
        payload = {
            'original_transaction_id': transaction_id,
            'amount': amount,
            'reason': 'Customer request'
        }
        
        result = self._make_request_with_retry('/api/v1/refunds/process', payload)
        
        return {
            'success': result.get('response_code') == '200',
            'transaction_id': result.get('refund_reference', f"AT_REFUND_{int(time.time())}"),
            'raw_response': result
        }
