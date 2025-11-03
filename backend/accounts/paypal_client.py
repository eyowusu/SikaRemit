import requests
from django.conf import settings

class PayPalClient:
    def __init__(self, client_id, client_secret, environment='sandbox'):
        self.client_id = client_id
        self.client_secret = client_secret
        self.base_url = f'https://api-m.{environment}.paypal.com'
        self.access_token = self._get_access_token()
    
    def _get_access_token(self):
        auth = requests.auth.HTTPBasicAuth(self.client_id, self.client_secret)
        data = {'grant_type': 'client_credentials'}
        
        response = requests.post(
            f'{self.base_url}/v1/oauth2/token',
            auth=auth,
            data=data
        )
        
        return response.json()['access_token']
    
    def create_qr_order(self, amount, currency):
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'intent': 'CAPTURE',
            'purchase_units': [{
                'amount': {
                    'currency_code': currency,
                    'value': str(amount)
                }
            }],
            'payment_source': {
                'paypal': {
                    'experience_context': {
                        'payment_method_preference': 'IMMEDIATE_PAYMENT_REQUIRED',
                        'payment_method_selected': 'PAYPAL',
                        'user_action': 'PAY_NOW',
                        'return_url': f'{settings.FRONTEND_URL}/checkout/success',
                        'cancel_url': f'{settings.FRONTEND_URL}/checkout/cancel'
                    }
                }
            }
        }
        
        response = requests.post(
            f'{self.base_url}/v2/checkout/orders',
            headers=headers,
            json=payload
        )
        
        return PayPalOrder(response.json())
    
    def check_order_complete(self, order_id):
        headers = {
            'Authorization': f'Bearer {self.access_token}'
        }
        
        response = requests.get(
            f'{self.base_url}/v2/checkout/orders/{order_id}',
            headers=headers
        )
        
        return response.json()['status'] == 'COMPLETED'

class PayPalOrder:
    def __init__(self, data):
        self.id = data['id']
        self.status = data['status']
        self.qr_code_url = data.get('links', [{}])[0].get('href', '')
        self.amount = data['purchase_units'][0]['amount']['value']
