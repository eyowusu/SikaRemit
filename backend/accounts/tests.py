from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User

class AuthenticationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('register')
        self.login_url = reverse('login')
        
    def test_user_registration(self):
        data = {
            'email': 'test@example.com',
            'password': 'securepassword123',
            'password2': 'securepassword123',
            'user_type': 3  # customer
        }
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue('access' in response.data)
        self.assertTrue('refresh' in response.cookies)
        
    def test_user_login(self):
        # First register
        user = User.objects.create_user(
            email='test@example.com',
            password='securepassword123',
            user_type=3
        )
        
        # Then login
        data = {'email': 'test@example.com', 'password': 'securepassword123'}
        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue('access' in response.data)
        self.assertTrue('refresh' in response.cookies)
