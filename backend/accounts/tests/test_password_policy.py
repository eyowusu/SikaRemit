from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

class PasswordPolicyTests(TestCase):
    def setUp(self):
        self.client = APIClient()
    
    def test_get_policy(self):
        response = self.client.get(reverse('password-policy'))
        self.assertEqual(response.status_code, 200)
        self.assertTrue('policy' in response.data)
    
    def test_check_strength(self):
        response = self.client.post(
            reverse('password-policy'),
            {'password': 'weak'},
            format='json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['score'] < 3)
