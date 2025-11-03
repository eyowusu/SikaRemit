from django.test import TestCase
from django.contrib.auth import get_user_model
from ..models import Payment
from accounts.models import Customer

User = get_user_model()

class BillPaymentTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        cls.customer = Customer.objects.create(
            user=cls.user,
            phone_number='233123456789'
        )
    
    def test_create_bill_payment(self):
        """Test creating a bill payment"""
        payment = Payment.objects.create(
            customer=self.customer,
            amount=100.00,
            bill_reference='BILL-001',
            bill_type='utility',
            bill_issuer='Water Company'
        )
        
        self.assertEqual(payment.bill_reference, 'BILL-001')
        self.assertEqual(payment.get_bill_type_display(), 'Utility Bill')
        self.assertFalse(payment.is_remitted)
    
    def test_remittance_processing(self):
        """Test remittance processing"""
        payment = Payment.objects.create(
            customer=self.customer,
            amount=150.00,
            bill_reference='BILL-002',
            bill_type='tax',
            status=Payment.COMPLETED
        )
        
        # Process remittance
        payment.is_remitted = True
        payment.remittance_reference = 'REM-20230101-001'
        payment.save()
        
        self.assertTrue(payment.is_remitted)
        self.assertIsNotNone(payment.remittance_reference)
    
    def test_bill_payment_str_representation(self):
        """Test the string representation of bill payments"""
        payment = Payment.objects.create(
            customer=self.customer,
            amount=200.00,
            bill_reference='BILL-003',
            bill_type='loan',
            status=Payment.COMPLETED
        )
        
        self.assertIn('BILL-003', str(payment))
        self.assertIn('Completed', str(payment))
