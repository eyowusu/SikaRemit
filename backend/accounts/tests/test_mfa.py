from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from users.models import User

class MFATests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='password123'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_mfa_setup(self):
        response = self.client.get(reverse('mfa-setup'))
        self.assertEqual(response.status_code, 200)
        self.assertTrue('secret' in response.data)
        self.assertTrue('qr_code' in response.data)
