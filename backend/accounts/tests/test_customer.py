from django.test import TestCase
from django.contrib.auth import get_user_model

User = get_user_model()

class CustomerFlowTest(TestCase):
    def test_full_flow(self):
        # Register
        res = self.client.post('/register/', {
            'email': 'customer@test.com',
            'password': 'test123',
            'user_type': 3,
            'name': 'Test Customer'
        })
        self.assertEqual(res.status_code, 201)
        
        # Login 
        login = self.client.post('/login/', {
            'email': 'customer@test.com',
            'password': 'test123'
        })
        self.assertEqual(login.status_code, 200)
        token = login.data['access']
        
        # Make payment
        payment = self.client.post('/transactions/', {
            'recipient': 'merchant@test.com',
            'amount': 100
        }, HTTP_AUTHORIZATION=f'Bearer {token}')
        self.assertEqual(payment.status_code, 201)
        
        # Check rewards
        rewards = self.client.get(
            '/customer/loyalty/',
            HTTP_AUTHORIZATION=f'Bearer {token}'
        )
        self.assertEqual(rewards.status_code, 200)
        self.assertEqual(rewards.data['points'], 100)  # 1 point per $1
