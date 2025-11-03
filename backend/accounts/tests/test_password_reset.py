from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from users.models import User

class PasswordResetTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='oldpassword'
        )
    
    def test_password_reset_flow(self):
        # Initiate reset
        response = self.client.post(
            reverse('password-reset'),
            {'email': 'test@example.com'}
        )
        self.assertEqual(response.status_code, 200)
        
        # Get the token (would normally be from email)
        token = PasswordResetToken.objects.first().token
        
        # Confirm reset
        response = self.client.post(
            reverse('password-reset-confirm'),
            {'token': token, 'new_password': 'newsecurepassword'}
        )
        self.assertEqual(response.status_code, 200)
