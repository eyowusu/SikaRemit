from django.test import TestCase
from django.contrib.auth import get_user_model
from unittest.mock import patch
from .services import PaymentService

User = get_user_model()

class SubscriptionTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='merchant@test.com',
            password='testpass123',
            user_type=2
        )
    
    @patch('stripe.Charge.create')
    def test_subscription_upgrade(self, mock_charge):
        mock_charge.return_value = {'id': 'ch_123'}
        
        PaymentService.process_subscription_payment(
            self.user,
            'premium',
            'tok_visa'
        )
        
        self.user.refresh_from_db()
        self.assertEqual(self.user.subscription_tier, 'premium')
        self.assertTrue(self.user.subscription_active)
