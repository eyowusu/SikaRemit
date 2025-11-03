import json
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from .factories import PaymentMethodFactory
from accounts.tests.factories import UserFactory, MerchantFactory
from django.core.cache import cache

class PaymentFlowTests(APITestCase):
    def setUp(self):
        self.user = UserFactory()
        self.merchant = MerchantFactory()
        self.payment_method = PaymentMethodFactory(user=self.user)
        self.client.force_authenticate(user=self.user)
        
    def test_payment_processing(self):
        url = reverse('process_payment')
        data = {
            'amount': '100.00',
            'payment_method': self.payment_method.id,
            'merchant_id': self.merchant.id
        }
        
        # First request should succeed
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Duplicate request with same idempotency key should return same result
        idempotency_key = 'test-key-123'
        headers = {'HTTP_IDEMPOTENCY_KEY': idempotency_key}
        
        first_response = self.client.post(url, data, **headers)
        second_response = self.client.post(url, data, **headers)
        
        self.assertEqual(first_response.data, second_response.data)
        
    def test_rate_limiting(self):
        url = reverse('process_payment')
        data = {'amount': '10.00', 'payment_method': self.payment_method.id}
        
        # Make 30 requests (should all succeed)
        for _ in range(30):
            response = self.client.post(url, data)
            self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_429_TOO_MANY_REQUESTS])
        
        # Next request should be rate limited
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        
    def test_webhook_security(self):
        url = reverse('mobile_money_webhook')
        data = {'transaction_id': 'test123', 'status': 'completed'}
        
        # Request without signature should fail
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
