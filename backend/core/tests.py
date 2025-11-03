from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

class CoreAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
    
    def test_health_check(self):
        response = self.client.get(reverse('health-check'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['status'], 'healthy')
    
    def test_tenant_routing(self):
        response = self.client.get(
            reverse('tenant-test'),
            HTTP_X_TENANT_ID='test_tenant'
        )
        self.assertEqual(response.data['data']['tenant'], 'test_tenant')
    
    def test_error_handling(self):
        # Test 400
        response = self.client.get(f"{reverse('test-error')}?bad=true")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        
        # Test 500
        response = self.client.get(f"{reverse('test-error')}?crash=true")
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('message', response.data)
