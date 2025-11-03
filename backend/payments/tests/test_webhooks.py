from django.test import TestCase, Client
from django.urls import reverse
from django.conf import settings
import hmac, hashlib, json
from .models import Payment

class MobileMoneyWebhookTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.payment = Payment.objects.create(
            reference='test123',
            amount=1000,
            status='pending'
        )
        
    def test_invalid_provider(self):
        response = self.client.post(
            reverse('mobile-money-webhook'),
            {'reference': 'test123', 'status': 'completed'},
            HTTP_X_PROVIDER='INVALID'
        )
        self.assertEqual(response.status_code, 400)

    def test_missing_signature(self):
        response = self.client.post(
            reverse('mobile-money-webhook'),
            {'reference': 'test123', 'status': 'completed'},
            HTTP_X_PROVIDER='MTN'
        )
        self.assertEqual(response.status_code, 401)
        
    def test_valid_mtn_webhook(self):
        body = json.dumps({'reference': 'test123', 'status': 'completed'})
        secret = settings.MOBILE_MONEY_PROVIDERS['MTN']['API_KEY'].encode()
        signature = hmac.new(secret, body.encode(), hashlib.sha256).hexdigest()
        
        response = self.client.post(
            reverse('mobile-money-webhook'),
            body,
            content_type='application/json',
            HTTP_X_PROVIDER='MTN',
            HTTP_X_MTN_SIGNATURE=signature
        )
        self.assertEqual(response.status_code, 200)
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, 'completed')
