from django.test import TestCase
from unittest.mock import patch, MagicMock
from users.models import User, Customer, Merchant
from .models import PaymentMethod, Transaction
from .services import PaymentProcessor
from .gateways.base import PaymentGateway

class PaymentProcessorTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.customer = Customer.objects.create(user=self.user)
        self.merchant = Merchant.objects.create(
            user=self.user,
            business_name='Test Merchant'
        )
        
        # Create test payment methods
        self.card_method = PaymentMethod.objects.create(
            user=self.user,
            method_type=PaymentMethod.CARD,
            details={'payment_method_id': 'pm_test123'}
        )
        self.momo_method = PaymentMethod.objects.create(
            user=self.user,
            method_type=PaymentMethod.MTN_MOMO,
            details={'phone_number': '0241234567'}
        )
        
        # Initialize payment processor
        self.processor = PaymentProcessor()
        
        # Mock gateways
        self.mock_gateway = MagicMock(spec=PaymentGateway)
        self.processor.register_gateway('stripe', self.mock_gateway)
        self.processor.register_gateway('mtn_momo', self.mock_gateway)
    
    def test_process_payment_success(self):
        """Test successful payment processing"""
        self.mock_gateway.process_payment.return_value = {
            'success': True,
            'transaction_id': 'txn_123'
        }
        
        txn = self.processor.process_payment(
            customer=self.customer,
            merchant=self.merchant,
            amount=100.00,
            currency='USD',
            payment_method=self.card_method
        )
        
        self.assertEqual(txn.status, Transaction.COMPLETED)
        self.mock_gateway.process_payment.assert_called_once()
    
    def test_process_payment_failure(self):
        """Test failed payment processing"""
        self.mock_gateway.process_payment.return_value = {
            'success': False,
            'error': 'Insufficient funds'
        }
        
        txn = self.processor.process_payment(
            customer=self.customer,
            merchant=self.merchant,
            amount=100.00,
            currency='USD',
            payment_method=self.card_method
        )
        
        self.assertEqual(txn.status, Transaction.FAILED)
    
    def test_refund_payment_success(self):
        """Test successful refund"""
        # First create a completed transaction
        txn = Transaction.objects.create(
            customer=self.customer,
            merchant=self.merchant,
            amount=100.00,
            currency='USD',
            payment_method=self.card_method,
            status=Transaction.COMPLETED
        )
        
        self.mock_gateway.refund_payment.return_value = {
            'success': True,
            'transaction_id': 'ref_123'
        }
        
        result = self.processor.refund_payment(txn)
        self.assertEqual(result.status, Transaction.REFUNDED)
    
    def test_mobile_money_payment(self):
        """Test mobile money payment processing"""
        self.mock_gateway.process_payment.return_value = {
            'success': True,
            'transaction_id': 'momo_123'
        }
        
        txn = self.processor.process_payment(
            customer=self.customer,
            merchant=self.merchant,
            amount=50.00,
            currency='GHS',
            payment_method=self.momo_method
        )
        
        self.assertEqual(txn.status, Transaction.COMPLETED)
        self.mock_gateway.process_payment.assert_called_once()
    
    def test_unknown_payment_method(self):
        """Test error for unknown payment method"""
        unknown_method = PaymentMethod.objects.create(
            user=self.user,
            method_type='unknown',
            details={}
        )
        
        with self.assertRaises(ValueError):
            self.processor.process_payment(
                customer=self.customer,
                merchant=self.merchant,
                amount=100.00,
                currency='USD',
                payment_method=unknown_method
            )
